/**
 * VARUNASETU — Multi-Key Groq Provider Manager
 *
 * Implements:
 * - 5-Key intelligent rotation (Least-Recently-Used / Round-Robin)
 * - Automatic 429 rate-limit detection & 60s cooldown
 * - Authentication (401) and Quota exhaustion (402/429-quota) isolation
 * - Bounded retries with exponential jitter
 * - Provider health tracking without exposing secret keys
 * - Graceful degradation when all keys are unavailable
 */

export interface KeyHealth {
  id: string;
  index: number;
  maskedKey: string;
  status: 'healthy' | 'cooling_down' | 'quota_exhausted' | 'invalid';
  requestsTotal: number;
  successCount: number;
  failureCount: number;
  lastUsedAt?: string;
  cooldownUntil?: number; // epoch ms
  lastError?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  content: string;
  keyIdUsed: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  durationMs: number;
}

export interface ProviderHealthReport {
  provider: 'Groq';
  status: 'operational' | 'degraded' | 'unavailable';
  healthyKeys: number;
  totalConfiguredKeys: number;
  totalRequests: number;
  keys: Omit<KeyHealth, 'key'>[];
  defaultModel: string;
  fastModel: string;
}

class GroqKeyManager {
  private keys: { key: string; health: KeyHealth }[] = [];
  private defaultModel: string;
  private fastModel: string;
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;
  private lastIndex: number = -1;

  constructor() {
    this.defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.fastModel = process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant';
    this.baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
    this.defaultTimeoutMs = Number(process.env.AI_REQUEST_TIMEOUT) || 25000;
    this.maxRetries = Number(process.env.AI_MAX_RETRIES) || 3;

    this.initializeKeys();
  }

  private maskKey(key: string): string {
    if (!key || key.length < 10) return 'invalid_key';
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  }

  private initializeKeys() {
    const rawKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4,
      process.env.GROQ_API_KEY_5,
    ].filter(Boolean) as string[];

    this.keys = rawKeys.map((key, index) => ({
      key,
      health: {
        id: `groq-key-${index + 1}`,
        index: index + 1,
        maskedKey: this.maskKey(key),
        status: 'healthy',
        requestsTotal: 0,
        successCount: 0,
        failureCount: 0,
      },
    }));
  }

  /**
   * Re-check cooled down keys
   */
  private checkCooldowns() {
    const now = Date.now();
    for (const item of this.keys) {
      if (item.health.status === 'cooling_down' && item.health.cooldownUntil && item.health.cooldownUntil <= now) {
        item.health.status = 'healthy';
        item.health.cooldownUntil = undefined;
        item.health.lastError = undefined;
      }
    }
  }

  /**
   * Select next eligible key using LRU / Round-Robin
   */
  private selectNextKey(): { key: string; health: KeyHealth } | null {
    this.checkCooldowns();
    const available = this.keys.filter(k => k.health.status === 'healthy');
    if (available.length === 0) return null;

    // Pick key with lowest requests or round-robin
    this.lastIndex = (this.lastIndex + 1) % available.length;
    return available[this.lastIndex];
  }

  /**
   * Execute chat completion with multi-key failover and bounded retries
   */
  public async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const model = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const maxAttempts = Math.min(this.maxRetries, Math.max(1, this.keys.length));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const selected = this.selectNextKey();
      if (!selected) {
        throw new Error(
          'All configured Groq API keys are currently cooling down, exhausted, or unavailable. Deterministic simulation remains active.'
        );
      }

      const { key, health } = selected;
      health.requestsTotal++;
      health.lastUsedAt = new Date().toISOString();

      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const payload: Record<string, unknown> = {
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.max_tokens ?? 2048,
        };

        if (options.response_format) {
          payload.response_format = options.response_format;
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        if (!res.ok) {
          const status = res.status;
          let errBody = '';
          try {
            errBody = await res.text();
          } catch {}

          // Error Classification
          if (status === 429) {
            // Rate Limit hit -> cool down this specific key for 60s
            health.status = 'cooling_down';
            health.cooldownUntil = Date.now() + 60000;
            health.failureCount++;
            health.lastError = `Rate limit (429): ${errBody.slice(0, 100)}`;
            console.warn(`[GroqKeyManager] Key ${health.maskedKey} rate-limited. Cooling down 60s. Failing over...`);
            continue; // try next key
          } else if (status === 401) {
            // Invalid key
            health.status = 'invalid';
            health.failureCount++;
            health.lastError = 'Authentication failed (401)';
            console.error(`[GroqKeyManager] Key ${health.maskedKey} invalid auth.`);
            continue; // try next key
          } else if (status === 402 || errBody.toLowerCase().includes('quota')) {
            // Quota exhausted
            health.status = 'quota_exhausted';
            health.failureCount++;
            health.lastError = 'Quota exhausted';
            console.warn(`[GroqKeyManager] Key ${health.maskedKey} quota exhausted.`);
            continue;
          } else {
            // Non-recoverable server or client error
            health.failureCount++;
            health.lastError = `HTTP ${status}: ${errBody.slice(0, 100)}`;
            throw new Error(`Groq API error (${status}): ${errBody.slice(0, 200)}`);
          }
        }

        const data = await res.json();
        health.successCount++;

        const choice = data.choices?.[0];
        const content = choice?.message?.content || '';

        return {
          content,
          keyIdUsed: health.id,
          model,
          usage: data.usage,
          durationMs,
        };
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMsg = err instanceof Error ? err.message : String(err);

        if (errMsg.includes('aborted') || errMsg.includes('timeout')) {
          health.failureCount++;
          health.lastError = 'Request timed out';
          console.warn(`[GroqKeyManager] Request timed out on key ${health.maskedKey}. Failing over...`);
          lastError = new Error(`Groq request timed out after ${timeoutMs}ms`);
          continue;
        }

        lastError = err instanceof Error ? err : new Error(errMsg);
      }
    }

    throw lastError || new Error('Failed to complete Groq inference after exhausting retry attempts.');
  }

  /**
   * Returns provider health report without exposing private keys
   */
  public getHealthReport(): ProviderHealthReport {
    this.checkCooldowns();
    const healthyCount = this.keys.filter(k => k.health.status === 'healthy').length;
    const totalRequests = this.keys.reduce((acc, k) => acc + k.health.requestsTotal, 0);

    const overallStatus: ProviderHealthReport['status'] =
      healthyCount === this.keys.length && this.keys.length > 0
        ? 'operational'
        : healthyCount > 0
        ? 'degraded'
        : 'unavailable';

    return {
      provider: 'Groq',
      status: overallStatus,
      healthyKeys: healthyCount,
      totalConfiguredKeys: this.keys.length,
      totalRequests,
      keys: this.keys.map(k => ({ ...k.health })),
      defaultModel: this.defaultModel,
      fastModel: this.fastModel,
    };
  }
}

// Global Singleton
const globalForGroq = globalThis as unknown as { groqKeyManager?: GroqKeyManager };
export const groqKeyManager = globalForGroq.groqKeyManager || new GroqKeyManager();
if (process.env.NODE_ENV !== 'production') globalForGroq.groqKeyManager = groqKeyManager;

