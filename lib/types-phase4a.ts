/**
 * VARUNASETU Phase 4A — Extended Type Definitions
 *
 * All existing types from lib/types.ts are preserved.
 * This file adds Phase 4A types for:
 *  - Shared Risk Link Groups (SRLG)
 *  - False Redundancy Analysis
 *  - Traffic Priority Classes
 *  - Repair Scheduling & Constraints
 *  - Dataset Ingestion Pipeline
 *  - Correlated Failure Scenarios
 *  - Network Graph
 *  - Service Contracts (Phase 4B interfaces)
 */

import { ProvenanceType, CableRoute, LandingStation, RepairVessel, FaultIncident } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK GRAPH
// ─────────────────────────────────────────────────────────────────────────────

export type NodeType = 'cable' | 'landing_station';

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  lat?: number;
  lon?: number;
  metadata?: Record<string, unknown>;
}

export interface NetworkEdge {
  id: string;
  sourceId: string;       // cable node id
  targetId: string;       // landing station node id
  capacityTbps?: number;
  currentLoadTbps?: number;
  availableCapacityTbps?: number;
  congested?: boolean;
  sequenceOrder?: number;
  provenance: ProvenanceType;
}

export interface NetworkGraph {
  version: string;
  datasetVersion: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  /** adjacency: node id → set of neighbour ids */
  adjacency: Record<string, string[]>;
  createdAt: string;
}

export interface Path {
  nodes: string[];
  edges: string[];
  totalCapacityTbps: number;
  bottleneckCapacityTbps: number;
  latencyMs?: number;
}

export interface ConnectivityResult {
  connected: boolean;
  components: string[][];
  isolatedNodes: string[];
  survivingEdges: NetworkEdge[];
  lostCapacityTbps: number;
  remainingCapacityTbps: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED RISK LINK GROUPS (SRLG)
// ─────────────────────────────────────────────────────────────────────────────

export type SRLGGroupType =
  | 'geographic_corridor'
  | 'shared_landing'
  | 'coastal_approach'
  | 'hazard_exposure'
  | 'shared_infrastructure';

export type SRLGConfidence = 'High' | 'Medium' | 'Low' | 'Insufficient_Evidence';

export interface SRLGGroup {
  id: string;
  name: string;
  groupType: SRLGGroupType;
  memberCableIds: string[];
  sharedLandingStationIds?: string[];
  /** WKT LineString or Polygon of the shared corridor/zone */
  geometryDescription?: string;
  /** Bounding box [minLon, minLat, maxLon, maxLat] */
  bbox?: [number, number, number, number];
  detectionMethod: string;
  /** km threshold used for corridor proximity detection */
  distanceThresholdKm?: number;
  /** Minimum shared corridor length used in detection */
  minOverlapKm?: number;
  confidence: SRLGConfidence;
  evidenceClass: ProvenanceType;
  sourceRecords: string[];
  datasetVersion: string;
  createdAt: string;
  notes: string;
}

export interface SRLGDetectionOptions {
  corridorThresholdKm: number;     // default: 50
  minCorridorOverlapKm: number;    // default: 200
  includeHazardExposure: boolean;
  datasetVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FALSE REDUNDANCY ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export type FalseRedundancyClassification =
  | 'Independent_Based_On_Available_Evidence'
  | 'Potentially_Shared_Risk'
  | 'Shared_Landing_Station_Dependency'
  | 'Shared_Corridor_Exposure'
  | 'Shared_Hazard_Exposure'
  | 'Insufficient_Evidence';

export interface FalseRedundancyAssessment {
  id: string;
  cableIdA: string;
  cableNameA: string;
  cableIdB: string;
  cableNameB: string;
  classification: FalseRedundancyClassification;
  sharedSRLGIds: string[];
  sharedLandingStationIds: string[];
  geographicSeparationKm: number | null;
  alternativeRouteAvailable: boolean;
  rationale: string;
  confidence: SRLGConfidence;
  evidenceClass: ProvenanceType;
  datasetVersion: string;
  assessedAt: string;
  limitations: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAFFIC PRIORITY
// ─────────────────────────────────────────────────────────────────────────────

export interface TrafficClass {
  id: string;
  name: string;
  description: string;
  priority: number;         // 1 = highest
  /** Minimum % of offered demand that must be served if capacity allows */
  minServiceGuaranteePct?: number;
  offeredDemandTbps: number;
  servedDemandTbps?: number;
  unservedDemandTbps?: number;
  evidenceClass: ProvenanceType;
}

export type AllocationPolicy =
  | 'equal_share'
  | 'strict_priority'
  | 'weighted_priority'
  | 'min_service_guarantee';

export interface AllocationPolicyConfig {
  policy: AllocationPolicy;
  weights?: Record<string, number>;     // classId → weight (for weighted_priority)
  minGuaranteePct?: number;             // for min_service_guarantee
}

export interface AllocationResult {
  runId: string;
  policy: AllocationPolicyConfig;
  trafficClasses: TrafficClass[];
  edges: NetworkEdge[];
  totalOfferedTbps: number;
  totalServedTbps: number;
  totalUnservedTbps: number;
  conservationError: number;            // should be < 0.001 Tbps
  congestedEdges: string[];
  bottleneckEdges: string[];
  provenance: 'Derived';
  timestamp: string;
  seed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR SCHEDULING
// ─────────────────────────────────────────────────────────────────────────────

export interface RepairConstraint {
  vesselId: string;
  faultId: string;
  /** Great-circle transit time at cruising speed */
  transitTimeHours: number;
  mobilisationHours: number;
  weatherWindowRequired: boolean;
  permitRequired: boolean;
  permitDelayDays?: number;
  weatherDelayHours?: number;
  repairDurationHours: number;
  maxDepthRequired: number;
  evidenceClass: ProvenanceType;
  source: string;
}

export interface RepairAssignment {
  faultId: string;
  vesselId: string;
  vesselName: string;
  assignedAt: string;
  dispatchHours: number;
  onStationHours: number;
  repairCompleteHours: number;
  permitDelayHours: number;
  weatherDelayHours: number;
  totalRestorationHours: number;
  feasible: boolean;
  infeasibilityReason?: string;
  evidenceClass: ProvenanceType;
}

export interface RepairSchedule {
  scheduleId: string;
  scenarioId: string;
  assignments: RepairAssignment[];
  resourceConflicts: ResourceConflict[];
  earliestRestorationHours: number;
  latestRestorationHours: number;
  provenance: 'Derived';
  assumptionSources: string[];
  timestamp: string;
}

export interface ResourceConflict {
  vesselId: string;
  conflictingFaultIds: string[];
  resolution: 'priority_order' | 'sequential' | 'unresolved';
  prioritisedFaultId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER & ENVIRONMENTAL
// ─────────────────────────────────────────────────────────────────────────────

export interface WeatherCondition {
  timestamp: string;
  lat: number;
  lon: number;
  windSpeedKnots: number;
  waveHeightM: number;
  seaState: number;         // Douglas Sea Scale 0–9
  operationallyAccessible: boolean;
  evidenceClass: ProvenanceType;
  source: string;
}

export interface WeatherWindow {
  startHour: number;        // relative to scenario start
  durationHours: number;
  averageWaveHeightM: number;
  averageWindKnots: number;
  operationally_feasible: boolean;
  evidenceClass: ProvenanceType;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRELATED FAILURE SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────

export type CorrelatedFailureTrigger =
  | 'independent'
  | 'shared_corridor'
  | 'shared_landing'
  | 'earthquake'
  | 'anchor_drag'
  | 'combined';

export interface CorrelatedFailureConfig {
  trigger: CorrelatedFailureTrigger;
  srlgId?: string;
  affectedCableIds: string[];
  failureFraction: number;          // 0–1, fraction of capacity lost per cable
  simultaneousTiming: boolean;
  cascadeDelayHours?: number;
  repairConstraintsEnabled: boolean;
  weatherConstraintsEnabled: boolean;
  permitConstraintsEnabled: boolean;
  trafficClasses?: TrafficClass[];
  allocationPolicy?: AllocationPolicyConfig;
  seed: number;
  datasetVersion: string;
}

export interface CorrelatedFailureResult {
  runId: string;
  scenarioId: string;
  config: CorrelatedFailureConfig;
  affectedCables: string[];
  survivingCables: string[];
  connectivity: ConnectivityResult;
  allocationResult: AllocationResult;
  repairSchedule?: RepairSchedule;
  weatherWindows?: WeatherWindow[];
  recoveryMilestones: Array<{
    phase: string;
    description: string;
    etaHours: number;
    capacityRecoveredPct: number;
    evidenceClass: ProvenanceType;
  }>;
  networkRecoveryTimeHours: number;
  provenance: 'Derived';
  engineVersion: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioComparison {
  comparisonId: string;
  scenarios: Array<{
    scenarioId: string;
    name: string;
    config: CorrelatedFailureConfig;
    result: CorrelatedFailureResult;
  }>;
  sharedSeed: number;
  sharedDatasetVersion: string;
  comparedAt: string;
  summary: {
    bestCriticalServiceScenario: string;
    bestTotalCapacityScenario: string;
    fastestRestorationScenario: string;
    lowestCostScenario: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA INGESTION PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

export type IngestFormat = 'CSV' | 'JSON' | 'GeoJSON' | 'GPKG' | 'XLSX';

export type IngestionZone = 'staging' | 'raw' | 'validated' | 'synthetic' | 'quarantine' | 'derived' | 'manifests';

export type IngestionJobStatus =
  | 'Pending'
  | 'Inspecting'
  | 'Schema_Detection'
  | 'Validating'
  | 'Quarantined'
  | 'Normalising'
  | 'Publishing'
  | 'Complete'
  | 'Failed';

export interface IngestionError {
  rowIndex: number | null;
  field: string;
  value: string;
  reason: string;
  severity: 'error' | 'warning';
}

export interface SchemaField {
  name: string;
  inferredType: 'string' | 'number' | 'boolean' | 'date' | 'geometry' | 'unknown';
  nullable: boolean;
  uniqueValues?: number;
  missingCount: number;
  sampleValues: string[];
}

export interface IngestionJob {
  jobId: string;
  datasetName: string;
  sourceFile: string;
  format: IngestFormat;
  zone: IngestionZone;
  status: IngestionJobStatus;
  evidenceClass: ProvenanceType;
  licenceStatus: 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | 'N/A';
  rowsTotal: number;
  rowsValid: number;
  rowsQuarantined: number;
  schema: SchemaField[];
  errors: IngestionError[];
  qualityScore: number;         // 0–100
  crsDetected?: string;         // e.g. "EPSG:4326 (WGS84)"
  bboxDetected?: [number, number, number, number];
  checksum?: string;
  startedAt: string;
  completedAt?: string;
  publishedVersion?: string;
  auditTrail: string[];
}

export interface DatasetManifestEntry {
  id: string;
  sheetName: string;
  inferredName: string;
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'extensions' | 'documentation' | string;
  format: string;
  /** SCREAMING_CASE version matching manifest JSON: OBSERVED_SOURCE, SYNTHETIC, DERIVED, ASSUMPTION */
  evidenceClass: 'OBSERVED_SOURCE' | 'SYNTHETIC' | 'DERIVED' | 'ASSUMPTION' | 'UNVERIFIED' | ProvenanceType | string;
  ingestionZone: IngestionZone;
  licenceCheckRequired: boolean;
  licenceStatus: 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | 'N/A';
  intendedUse: string;
  intendedTable?: string;
  status: 'Ready' | 'Pending_Licence' | 'Synthetic_Only' | 'Missing';
  priority: 'P1' | 'P2' | 'P3';
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FALSE REDUNDANCY SCENARIO LAB
// ─────────────────────────────────────────────────────────────────────────────

export type FalseRedundancyScenarioType =
  | 'A_independent_paths'
  | 'B_shared_corridor'
  | 'C_shared_landing'
  | 'D_shared_hazard'
  | 'E_repair_vessel_scarcity'
  | 'F_weather_constraints'
  | 'G_permit_constraints'
  | 'H_priority_aware_recovery'
  | 'I_combined_false_redundancy';

export interface FalseRedundancyScenario {
  id: string;
  type: FalseRedundancyScenarioType;
  title: string;
  brief: string;
  config: CorrelatedFailureConfig;
  result?: CorrelatedFailureResult;
  comparedAgainst?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK RESILIENCE METRICS
// ─────────────────────────────────────────────────────────────────────────────

export interface NetworkResilienceMetrics {
  independentPathCount: number;
  sharedRiskGroupCount: number;
  falseRedundancyCount: number;
  criticalLandingDependencies: string[];
  networkConnectivityPct: number;
  totalCapacityTbps: number;
  availableCapacityPct: number;
  congestionRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  evidenceClass: ProvenanceType;
  computedAt: string;
  datasetVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT & PROVENANCE
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SourceLicence {
  id: string;
  sourceName: string;
  licenceType: string;
  redistributionAllowed: boolean | 'unknown';
  attributionRequired: boolean;
  attributionText?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes: string;
}

export interface Assumption {
  id: string;
  parameter: string;
  value: number | string;
  units: string;
  rationale: string;
  allowedRange?: [number, number];
  sensitivityPlan: string;
  evidenceClass: 'ASSUMPTION';
  datasetSource: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4B SERVICE CONTRACTS (interfaces only — implementation in Phase 4B)
// ─────────────────────────────────────────────────────────────────────────────

export interface INetworkAnalysisService {
  getTopology(datasetVersion: string): NetworkGraph;
  findPaths(sourceId: string, destinationId: string): Path[];
  computeConnectivity(failedNodeIds: string[]): ConnectivityResult;
  computeResilienceMetrics(): NetworkResilienceMetrics;
}

export interface ISRLGService {
  detectAllGroups(cables: CableRoute[], options: SRLGDetectionOptions): SRLGGroup[];
  getGroupsForCable(cableId: string): SRLGGroup[];
  assessFalseRedundancy(cableIdA: string, cableIdB: string): FalseRedundancyAssessment;
  getAllAssessments(): FalseRedundancyAssessment[];
}

export interface IScenarioExecutionService {
  execute(scenario: CorrelatedFailureConfig): CorrelatedFailureResult;
  compare(scenarios: CorrelatedFailureConfig[]): ScenarioComparison;
}

export interface ITrafficAllocationService {
  allocate(
    graph: NetworkGraph,
    trafficClasses: TrafficClass[],
    policyConfig: AllocationPolicyConfig
  ): AllocationResult;
  validateConservation(result: AllocationResult): boolean;
}

export interface IRepairSchedulingService {
  schedule(
    vessels: RepairVessel[],
    faults: FaultIncident[],
    constraints: RepairConstraint[],
    weatherWindows?: WeatherWindow[]
  ): RepairSchedule;
  detectConflicts(schedule: RepairSchedule): ResourceConflict[];
}

export interface IIngestionService {
  inspect(file: File): Promise<Partial<IngestionJob>>;
  validate(job: IngestionJob): Promise<IngestionJob>;
  publish(job: IngestionJob): Promise<string>; // returns version id
}

export interface IEvidenceService {
  classify(datasetId: string): ProvenanceType;
  getProvenance(entityId: string): string;
  assertNotSynthetic(datasetId: string, fieldName: string): void;
}

export interface IReportGenerationService {
  generatePDF(runId: string, options: ReportOptions): Promise<Blob>;
  generateCSV(runId: string): Promise<string>;
}

export interface ReportOptions {
  includeDatasetVersion: boolean;
  includeScenarioId: boolean;
  includeAssumptions: boolean;
  includeEvidenceClasses: boolean;
  includeMethodology: boolean;
  includeLimitations: boolean;
}
