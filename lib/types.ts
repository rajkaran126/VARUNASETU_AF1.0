export type ProvenanceType = 'Observed' | 'Derived' | 'Synthetic' | 'Assumed' | 'Unverified';

export interface LandingStation {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  cablesConnected: string[];
}

export type CableOperationalStatus = 'Operational' | 'Degraded' | 'Severed' | 'Maintenance';

export interface CableRoute {
  id: string;
  name: string;
  rfsYear: number | 'Unmeasured';
  lengthKm: number | 'Unmeasured';
  designCapacityTbps: number | 'Unmeasured';
  litCapacityTbps: number | 'Unmeasured';
  fiberPairs: number | 'Unmeasured';
  owners: string[];
  status: CableOperationalStatus;
  region: string;
  landingStations: LandingStation[];
  routeCoordinates: [number, number][]; // [lon, lat]
  provenance: ProvenanceType;
  lastUpdated: string;
  knownIncidents: number;
  notes: string;
}

export type FaultType = 
  | 'Physical Anchor Drag'
  | 'Benthic Rupture / Seismic'
  | 'Subsea Landslide'
  | 'Repeater / Amplifier Failure'
  | 'Shunt Fault (Insulation Breakdown)'
  | 'Commercial Fishing Gear Entanglement';

export interface FaultIncident {
  id: string;
  cableId: string;
  cableName: string;
  timestamp: string;
  faultType: FaultType;
  lat: number;
  lon: number;
  depthMeters: number;
  distanceKmFromLanding: number;
  nearestLandingStation: string;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Minor';
  opticalLossDb: number;
  affectedTrafficTbps: number;
  status: 'Active' | 'Investigating' | 'Dispatched' | 'Splicing' | 'Restored';
  provenance: ProvenanceType;
}

export interface FaultNotification {
  id: string;
  cableId: string;
  cableName: string;
  title: string;
  description: string;
  faultType: FaultType;
  lat: number;
  lon: number;
  depthMeters: number;
  nearestLandingStation: string;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Minor';
  opticalLossDb: number;
  affectedTrafficTbps: number;
  detectedAt: string;
  sourceSensor: string;
  status: 'Pending' | 'Approved' | 'Declined';
  approvalDecision?: {
    decidedAt: string;
    actionTaken: 'Considered as Active Fault' | 'Dismissed as False Alarm';
  };
}

export interface ScenarioConfig {
  id: string;
  name: string;
  selectedCableIds: string[];
  faultType: FaultType;
  faultLocation: {
    lat: number;
    lon: number;
    depthM: number;
    description: string;
  };
  trafficDemandAssumptionTbps: number;
  failureDurationHours: number;
  availableAlternateRoutes: string[];
  notes?: string;
}

export interface RouteLoadMetrics {
  routeId: string;
  routeName: string;
  initialLoadPct: number;
  postFailureLoadPct: number;
  initialThroughputTbps: number;
  postFailureThroughputTbps: number;
  maxCapacityTbps: number;
  headroomTbps: number;
  congested: boolean;
}

export interface RecoveryMilestone {
  phase: string;
  description: string;
  etaHours: number;
  capacityRecoveredPct: number;
}

export interface SimulationResult {
  scenarioId: string;
  timestamp: string;
  engineVersion: string;
  randomSeed: number;
  totalOfferedDemandTbps: number;
  servedDemandTbps: number;
  unservedDemandTbps: number;
  capacityUtilizationPct: number;
  baselineLatencyMs: number;
  impactedLatencyMs: number;
  latencyDeltaMs: number;
  affectedRoutes: RouteLoadMetrics[];
  recoveryMilestones: RecoveryMilestone[];
  provenance: 'Derived';
}

export interface RepairVessel {
  id: string;
  name: string;
  imo: string;
  vesselType: string;
  currentPort: string;
  lat: number;
  lon: number;
  status: 'Stationed at Port' | 'In Transit' | 'On Station' | 'Mobilizing';
  dpRating: 'DP1' | 'DP2' | 'DP3';
  rovDepthRatingM: number;
  cableTankCapacityTonnes: number;
  cruisingSpeedKnots: number;
  provenance: 'Observed' | 'Assumed';
  lastAisUpdate: string;
}

export interface RecoveryStrategy {
  id: string;
  title: string;
  strategyType: 'Optical Reroute' | 'Carrier Grooming' | 'Physical Repair' | 'Hybrid Mitigation';
  timeToExecute: string;
  capacityRestoredPct: number;
  latencyImpactMs: number;
  estimatedCostUsd: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Extreme';
  feasibilityScorePct: number;
  recommended: boolean;
  description: string;
  actionSteps: string[];
}

export type AgentRole = 
  | 'Chief Orchestrator'
  | 'Network Analyst'
  | 'Risk & Scenario Agent'
  | 'Logistics & Repair Agent'
  | 'Policy & Impact Agent';

export interface AgentMessage {
  id: string;
  sender: 'user' | 'orchestrator' | 'network_analyst' | 'risk_scenario' | 'logistics_repair' | 'policy_impact';
  agentName: string;
  agentRole: AgentRole;
  content: string;
  timestamp: string;
  reasoningChain?: string[];
  metrics?: { label: string; value: string; unit?: string }[];
  suggestedActions?: { label: string; actionId: string }[];
}

export interface DatasetRecord {
  id: string;
  name: string;
  fileType: 'CSV' | 'JSON' | 'GeoJSON' | 'GPKG';
  rowCount: number;
  fileSizeKb: number;
  uploadedAt: string;
  provenance: ProvenanceType;
  validationStatus: 'Valid' | 'Warnings' | 'Errors';
  validationErrors: string[];
  description: string;
}

export interface SimulationSnapshot {
  snapshotId: string;
  name: string;
  createdAt: string;
  seed: number;
  engineVersion: string;
  scenario: ScenarioConfig;
  result: SimulationResult;
  provenance: 'Derived';
}

