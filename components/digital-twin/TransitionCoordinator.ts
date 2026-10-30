import { ContourlinesGlobeHandle } from '../earth/ContourlinesGlobe';
import { UnderwaterSceneHandle } from './UnderwaterScene';

export type TransitionStage =
  | 'idle'
  | 'fault_selected'
  | 'earth_approach'
  | 'vessel_transit'
  | 'ocean_descent'
  | 'underwater_reveal'
  | 'repair_active';

export interface TransitionState {
  currentStage: TransitionStage;
  stageProgress: number; // 0.0 to 1.0
  currentDepthMeters: number; // 0 to 4820
  earthOpacity: number; // 1.0 to 0.0
  underwaterOpacity: number; // 0.0 to 1.0
  statusMessage: string;
}

export class TransitionCoordinator {
  private globe: ContourlinesGlobeHandle | null = null;
  private underwater: UnderwaterSceneHandle | null = null;
  private state: TransitionState;
  private onStateChange: (state: TransitionState) => void;
  private animationId: number | null = null;

  constructor(onStateChange: (state: TransitionState) => void) {
    this.onStateChange = onStateChange;
    this.state = {
      currentStage: 'idle',
      stageProgress: 0.0,
      currentDepthMeters: 0,
      earthOpacity: 1.0,
      underwaterOpacity: 0.0,
      statusMessage: 'Global Topology Exploration',
    };
  }

  public registerGlobe(globe: ContourlinesGlobeHandle | null) {
    this.globe = globe;
  }

  public registerUnderwater(underwater: UnderwaterSceneHandle | null) {
    this.underwater = underwater;
  }

  /**
   * Execute the continuous Earth-to-Underwater camera journey
   */
  public startDescentJourney(
    targetLon: number,
    targetLat: number,
    maxDepthMeters: number = 4820,
    onComplete?: () => void
  ) {
    if (!this.globe) return;

    // 1. Stage: Fault Selected & Earth Approach (Zoom from world globe into fault site)
    this.updateState({
      currentStage: 'earth_approach',
      stageProgress: 0.0,
      currentDepthMeters: 0,
      earthOpacity: 1.0,
      underwaterOpacity: 0.0,
      statusMessage: 'Approaching Benthic Epicenter (Bab el-Mandeb)',
    });

    this.globe.flyTo(targetLon, targetLat, 18.0, 2400, () => {
      // 2. Stage: Simulated Vessel Transit
      this.updateState({
        currentStage: 'vessel_transit',
        stageProgress: 0.0,
        currentDepthMeters: 0,
        earthOpacity: 1.0,
        underwaterOpacity: 0.0,
        statusMessage: 'CS Sovereign (DP2) En Route to Fault Coordinates',
      });

      let transitProgress = 0.0;
      const transitDuration = 1800; // ms
      const transitStart = performance.now();

      const runTransit = () => {
        const elapsed = performance.now() - transitStart;
        transitProgress = Math.min(1.0, elapsed / transitDuration);

        this.updateState({
          currentStage: 'vessel_transit',
          stageProgress: transitProgress,
          currentDepthMeters: 0,
          earthOpacity: 1.0,
          underwaterOpacity: 0.0,
          statusMessage: `DP2 Vessel Transit: ${(transitProgress * 100).toFixed(0)}%`,
        });

        if (transitProgress < 1.0) {
          requestAnimationFrame(runTransit);
        } else {
          // 3. Stage: Ocean Descent (Camera breaks surface, depth increases 0 -> 4820m)
          this.executeOceanDescent(maxDepthMeters, onComplete);
        }
      };

      requestAnimationFrame(runTransit);
    });
  }

  private executeOceanDescent(maxDepth: number, onComplete?: () => void) {
    const descentDuration = 3200; // ms
    const descentStart = performance.now();

    const runDescent = () => {
      const elapsed = performance.now() - descentStart;
      const progress = Math.min(1.0, elapsed / descentDuration);
      // Smooth cubic easing
      const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentDepth = Math.round(t * maxDepth);
      // Seamless cross-fade between Earth and Three.js underwater canvas
      const earthOp = Math.max(0.0, 1.0 - t * 1.5);
      const underOp = Math.min(1.0, t * 1.3);

      if (this.underwater && this.underwater.setDepthLevel) {
        this.underwater.setDepthLevel(currentDepth);
      }

      this.updateState({
        currentStage: progress < 0.85 ? 'ocean_descent' : 'underwater_reveal',
        stageProgress: progress,
        currentDepthMeters: currentDepth,
        earthOpacity: earthOp,
        underwaterOpacity: underOp,
        statusMessage:
          progress < 0.85
            ? `Subsea Descent: -${currentDepth}m (Entering Abyssal Trench)`
            : 'Locking Benthic Coordinates & Deploying Mini-ROV Guardian',
      });

      if (progress < 1.0) {
        requestAnimationFrame(runDescent);
      } else {
        // Complete transition: Handover to interactive physical repair sequence
        this.updateState({
          currentStage: 'repair_active',
          stageProgress: 1.0,
          currentDepthMeters: maxDepth,
          earthOpacity: 0.0,
          underwaterOpacity: 1.0,
          statusMessage: 'Benthic Station Kept · Physical Repair Enclave Active',
        });

        if (this.underwater && this.underwater.setPerspective) {
          this.underwater.setPerspective('ROV Cam');
        }

        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(runDescent);
  }

  /**
   * Return back to global Earth view
   */
  public returnToEarth(onComplete?: () => void) {
    this.updateState({
      currentStage: 'idle',
      stageProgress: 0.0,
      currentDepthMeters: 0,
      earthOpacity: 1.0,
      underwaterOpacity: 0.0,
      statusMessage: 'Global Topology Exploration',
    });
    if (this.globe) {
      this.globe.flyTo(43.3, 12.3, 2.4, 1500, onComplete);
    }
  }

  private updateState(newState: Partial<TransitionState>) {
    this.state = { ...this.state, ...newState };
    this.onStateChange({ ...this.state });
  }

  public getState() {
    return { ...this.state };
  }
}

