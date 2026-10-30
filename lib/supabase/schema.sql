-- ==============================================================================
-- VARUNASETU: Phase 4B Supabase PostgreSQL Migration Schema
-- Investigations, Copilot Memory, Agent Findings & Audit Trail
-- ==============================================================================

-- 1. Investigations Table
CREATE TABLE IF NOT EXISTS public.investigations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'commander-01',
  title TEXT NOT NULL,
  network_region TEXT NOT NULL DEFAULT 'Global',
  status TEXT NOT NULL CHECK (status IN ('Active', 'Resolved', 'Archived')) DEFAULT 'Active',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Saved Scenarios Table
CREATE TABLE IF NOT EXISTS public.saved_scenarios (
  id TEXT PRIMARY KEY,
  investigation_id TEXT REFERENCES public.investigations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  impacted_cables TEXT[] NOT NULL,
  fault_type TEXT NOT NULL,
  fault_location_lat DOUBLE PRECISION,
  fault_location_lon DOUBLE PRECISION,
  depth_meters DOUBLE PRECISION,
  traffic_demand_tbps DOUBLE PRECISION,
  duration_hours INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Simulation Runs Table
CREATE TABLE IF NOT EXISTS public.simulation_runs (
  id TEXT PRIMARY KEY,
  scenario_id TEXT REFERENCES public.saved_scenarios(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL DEFAULT 'vSetu-SimKernel-2.4',
  seed BIGINT NOT NULL,
  served_demand_tbps DOUBLE PRECISION NOT NULL,
  unserved_demand_tbps DOUBLE PRECISION NOT NULL,
  baseline_latency_ms DOUBLE PRECISION NOT NULL,
  impacted_latency_ms DOUBLE PRECISION NOT NULL,
  latency_delta_ms DOUBLE PRECISION NOT NULL,
  capacity_utilization_pct DOUBLE PRECISION NOT NULL,
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id TEXT PRIMARY KEY,
  investigation_id TEXT REFERENCES public.investigations(id) ON DELETE CASCADE,
  context_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Copilot Messages Table
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'copilot', 'system')),
  role TEXT NOT NULL DEFAULT 'assistant',
  content TEXT NOT NULL,
  citations TEXT[] DEFAULT ARRAY[]::TEXT[],
  reasoning_chain TEXT[] DEFAULT ARRAY[]::TEXT[],
  metrics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Agent Executions Table
CREATE TABLE IF NOT EXISTS public.agent_executions (
  id TEXT PRIMARY KEY,
  simulation_run_id TEXT,
  agent_role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Queued', 'Running', 'Completed', 'Failed')) DEFAULT 'Completed',
  execution_time_ms INT NOT NULL,
  groq_key_used TEXT NOT NULL,
  token_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Agent Findings Table
CREATE TABLE IF NOT EXISTS public.agent_findings (
  id TEXT PRIMARY KEY,
  execution_id TEXT REFERENCES public.agent_executions(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_citations TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read & write for demonstration & service-role
CREATE POLICY "Public Read Access" ON public.investigations FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.investigations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON public.investigations FOR UPDATE USING (true);

CREATE POLICY "Public Read Scenarios" ON public.saved_scenarios FOR SELECT USING (true);
CREATE POLICY "Public Insert Scenarios" ON public.saved_scenarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read SimulationRuns" ON public.simulation_runs FOR SELECT USING (true);
CREATE POLICY "Public Insert SimulationRuns" ON public.simulation_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Conversations" ON public.copilot_conversations FOR SELECT USING (true);
CREATE POLICY "Public Insert Conversations" ON public.copilot_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Messages" ON public.copilot_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Messages" ON public.copilot_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read AgentExecutions" ON public.agent_executions FOR SELECT USING (true);
CREATE POLICY "Public Insert AgentExecutions" ON public.agent_executions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read AgentFindings" ON public.agent_findings FOR SELECT USING (true);
CREATE POLICY "Public Insert AgentFindings" ON public.agent_findings FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read AuditLogs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert AuditLogs" ON public.audit_logs FOR INSERT WITH CHECK (true);

