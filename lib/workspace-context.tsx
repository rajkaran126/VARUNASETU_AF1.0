'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CableRoute, 
  FaultIncident, 
  FaultNotification,
  ScenarioConfig, 
  SimulationResult, 
  RepairVessel, 
  RecoveryStrategy, 
  DatasetRecord, 
  SimulationSnapshot,
  AgentMessage,
  ReroutePlan
} from './types';
import { 
  VERIFIED_CABLE_ROUTES, 
  ACTIVE_FAULT_INCIDENTS, 
  INITIAL_FAULT_NOTIFICATIONS,
  REPAIR_FLEET, 
  INITIAL_RECOVERY_STRATEGIES, 
  INITIAL_DATASETS,
  DETERMINED_REROUTE_PLANS
} from './cable-data';
import { runNetworkSimulation } from './simulation-engine';
import { ALL_CABLE_ROUTES, ALL_FAULT_INCIDENTS } from './cable-registry';
export { ALL_CABLE_ROUTES, ALL_FAULT_INCIDENTS };

interface WorkspaceContextType {
  // Canonical Cable & Fault State
  cables: CableRoute[];
  selectedCable: CableRoute;
  setSelectedCable: (cable: CableRoute) => void;
  activeFault: FaultIncident;
  setActiveFault: (fault: FaultIncident) => void;
  
  // Fault Notifications System
  notifications: FaultNotification[];
  pendingNotificationsCount: number;
  approveFaultNotification: (id: string) => void;
  declineFaultNotification: (id: string) => void;
  isNotificationTrayOpen: boolean;
  setIsNotificationTrayOpen: (open: boolean) => void;
  activeConfirmedNotification: FaultNotification | null;
  dismissConfirmedNotification: () => void;
  incomingWhatIfAlert: FaultNotification | null;
  dismissIncomingWhatIfAlert: () => void;
  generateWhatIfBreakage: (customParams?: Partial<FaultNotification>) => FaultNotification;
  isWhatIfModalOpen: boolean;
  setIsWhatIfModalOpen: (open: boolean) => void;

  // Scenario & Simulation Engine State
  activeScenario: ScenarioConfig;
  setActiveScenario: (scenario: ScenarioConfig) => void;
  simulationResult: SimulationResult;
  executeSimulation: (customScenario?: ScenarioConfig) => void;

  // Recovery War Room State
  strategies: RecoveryStrategy[];
  selectedStrategy: RecoveryStrategy;
  setSelectedStrategy: (strategy: RecoveryStrategy) => void;
  repairFleet: RepairVessel[];

  // Dynamic Rerouting & Post-Breakdown Bypass State
  reroutePlans: ReroutePlan[];
  activeReroutePlan: ReroutePlan | null;
  setActiveReroutePlan: (plan: ReroutePlan | null) => void;
  isRerouteActive: boolean;
  setIsRerouteActive: (active: boolean) => void;
  toggleRerouteStatus: () => void;
  isRerouteSimulating: boolean;
  rerouteSimulationProgress: number;
  rerouteSimulationStep: string;
  rerouteSimulationLog: string[];
  runRerouteSimulation: (targetPlanId: string) => Promise<void>;

  // Multi-Agent Mission Control State
  agentMessages: AgentMessage[];
  sendAgentQuery: (promptText: string) => void;
  resetAgentChat: () => void;
  isAgentThinking: boolean;

  // Data & Infrastructure State
  datasets: DatasetRecord[];
  addDatasetRecord: (record: DatasetRecord) => void;
  snapshots: SimulationSnapshot[];
  saveCurrentSnapshot: (name: string) => void;
}

const defaultScenario: ScenarioConfig = {
  id: 'scen-smw4-red-sea-rupture',
  name: 'Red Sea Chokepoint Dual Severance',
  selectedCableIds: ['smw4', 'smw5'],
  faultType: 'Physical Anchor Drag',
  faultLocation: {
    lat: 12.3081,
    lon: 43.4892,
    depthM: 4120,
    description: 'Bab el-Mandeb Benthic Slope (Segment 4)'
  },
  trafficDemandAssumptionTbps: 45.0,
  failureDurationHours: 336,
  availableAlternateRoutes: ['aae1', '2africa', 'faster', 'marea'],
  notes: 'Commercial cargo ship dragged anchor during gale conditions across subsea corridor.'
};

const initialSimulationResult = runNetworkSimulation(defaultScenario, VERIFIED_CABLE_ROUTES);

const initialAgentConversation: AgentMessage[] = [
  {
    id: 'msg-sys-1',
    sender: 'orchestrator',
    agentName: 'Chief Orchestrator',
    agentRole: 'Chief Orchestrator',
    content: 'VARUNASETU Multi-Agent Coordination Bus online. Telemetry monitoring active across 426 subsea systems. Anomaly detected in Red Sea corridor on SEA-ME-WE 4 & SEA-ME-WE 5. How shall we prioritize the response?',
    timestamp: '2026-10-30T09:00:10Z',
    reasoningChain: [
      'Ingested optical loss telemetry from Djibouti and Suez landing stations.',
      'Correlated Loss of Signal (LOS) on SMW4 Segment 4 with OTDR reflection at 640km mark.',
      'Synthesized multi-agent readiness across Network, Risk, Logistics, and Policy domains.'
    ],
    metrics: [
      { label: 'Active Cables', value: '426' },
      { label: 'Network Integrity', value: '96.4%' },
      { label: 'Corridor Load', value: '88.2%' }
    ],
    suggestedActions: [
      { label: 'Run Corridor Blast-Radius Simulation', actionId: 'run-blast-radius' },
      { label: 'Dispatch Nearest DP2 Repair Vessel', actionId: 'dispatch-vessel' },
      { label: 'Evaluate Dynamic Optical Reroute', actionId: 'eval-reroute' }
    ]
  }
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // Full registry: 692 real + curated cables
  const [cables, setCables] = useState<CableRoute[]>(ALL_CABLE_ROUTES);
  const [selectedCable, setSelectedCable] = useState<CableRoute>(VERIFIED_CABLE_ROUTES[0]);
  const [activeFault, setActiveFault] = useState<FaultIncident>(ACTIVE_FAULT_INCIDENTS[0]);
  
  // Notifications State
  const [notifications, setNotifications] = useState<FaultNotification[]>(INITIAL_FAULT_NOTIFICATIONS);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState<boolean>(false);
  const [activeConfirmedNotification, setActiveConfirmedNotification] = useState<FaultNotification | null>(null);
  const [incomingWhatIfAlert, setIncomingWhatIfAlert] = useState<FaultNotification | null>(null);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);

  const dismissIncomingWhatIfAlert = () => {
    setIncomingWhatIfAlert(null);
  };

  const pendingNotificationsCount = notifications.filter(n => n.status === 'Pending').length;

  const [activeScenario, setActiveScenario] = useState<ScenarioConfig>(defaultScenario);
  const [simulationResult, setSimulationResult] = useState<SimulationResult>(initialSimulationResult);

  const [strategies, setStrategies] = useState<RecoveryStrategy[]>(INITIAL_RECOVERY_STRATEGIES);
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy>(INITIAL_RECOVERY_STRATEGIES[0]);
  const [repairFleet] = useState<RepairVessel[]>(REPAIR_FLEET);

  // Dynamic Rerouting & Post-Breakdown Bypass State
  const [reroutePlans, setReroutePlans] = useState<ReroutePlan[]>(DETERMINED_REROUTE_PLANS);
  const [activeReroutePlan, setActiveReroutePlan] = useState<ReroutePlan | null>(DETERMINED_REROUTE_PLANS[0]);
  const [isRerouteActive, setIsRerouteActive] = useState<boolean>(true);
  const [isRerouteSimulating, setIsRerouteSimulating] = useState<boolean>(false);
  const [rerouteSimulationProgress, setRerouteSimulationProgress] = useState<number>(0);
  const [rerouteSimulationStep, setRerouteSimulationStep] = useState<string>('');
  const [rerouteSimulationLog, setRerouteSimulationLog] = useState<string[]>([]);

  const toggleRerouteStatus = () => {
    setIsRerouteActive(prev => !prev);
  };

  const runRerouteSimulation = async (targetPlanId: string) => {
    const targetPlan = reroutePlans.find(p => p.id === targetPlanId);
    if (!targetPlan) return;

    setIsRerouteSimulating(true);
    setRerouteSimulationProgress(8);
    setRerouteSimulationStep(`Initiating path transition to ${targetPlan.title.split(':')[0]}...`);
    setRerouteSimulationLog([`[T+0.00s] Commencing deterministic reroute simulation kernel...`]);

    const steps = [
      {
        progress: 24,
        delay: 320,
        step: `Isolating optical LOS alarms on SEA-ME-WE 4 Djibouti Segment 4 (-4,120m)`,
        log: `[T+0.42s] Optical loss detected: 42.8 dB. Segment flagged unviable. Ingesting candidate topological graph.`
      },
      {
        progress: 52,
        delay: 450,
        step: `Calculating path vector & distance: ${targetPlan.bypassCorridorName}`,
        log: `[T+1.05s] Candidate path traversed across ${targetPlan.waypoints.length} landing stations. Querying transponder headroom.`
      },
      {
        progress: 78,
        delay: 400,
        step: `Grooming coherent 800G lambdas & equalizing optical OSNR margins`,
        log: `[T+1.75s] Allocating ${targetPlan.restoredCapacityTbps} Tbps burst lambdas. Computed latency penalty: +${targetPlan.latencyPenaltyMs} ms.`
      },
      {
        progress: 94,
        delay: 380,
        step: `Broadcasting BGP community updates & activating DWDM cross-connects`,
        log: `[T+2.35s] BGP convergence confirmed across border gateways. Simulated convergence time: 3.8s.`
      },
      {
        progress: 100,
        delay: 300,
        step: `Reroute Path Locked & Operational: Restoring ${targetPlan.restoredCapacityPct}% network flow`,
        log: `[T+2.85s] Complete. Post-breakdown bypass locked until physical benthic splice.`
      }
    ];

    for (const s of steps) {
      await new Promise(r => setTimeout(r, s.delay));
      setRerouteSimulationProgress(s.progress);
      setRerouteSimulationStep(s.step);
      setRerouteSimulationLog(prev => [...prev, s.log]);
    }

    setActiveReroutePlan(targetPlan);
    setIsRerouteActive(true);
    setTimeout(() => {
      setIsRerouteSimulating(false);
    }, 1000);
  };

  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>(initialAgentConversation);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);

  const [datasets, setDatasets] = useState<DatasetRecord[]>(INITIAL_DATASETS);
  const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>([
    {
      snapshotId: 'snap-baseline-2026',
      name: 'Baseline Red Sea Double Severance Snapshot',
      createdAt: '2026-10-30T09:05:00Z',
      seed: 20261030,
      engineVersion: 'vSetu-SimKernel-2.4-Deterministic',
      scenario: defaultScenario,
      result: initialSimulationResult,
      provenance: 'Derived'
    }
  ]);

  // Keep selected cable in sync when fault changes
  useEffect(() => {
    const matched = cables.find(c => c.id === activeFault.cableId);
    if (matched) {
      setSelectedCable(matched);
    }
  }, [activeFault, cables]);

  const executeSimulation = (customScenario?: ScenarioConfig) => {
    const sc = customScenario || activeScenario;
    const result = runNetworkSimulation(sc, cables);
    setSimulationResult(result);
  };

  const generateWhatIfBreakage = (customParams?: Partial<FaultNotification>): FaultNotification => {
    const targetCable = customParams?.cableId 
      ? cables.find(c => c.id === customParams.cableId) || selectedCable
      : selectedCable;

    const firstStation = targetCable.landingStations && targetCable.landingStations.length > 0
      ? targetCable.landingStations[0]
      : null;

    const newNotifId = 'notif-whatif-' + Date.now();
    const newNotif: FaultNotification = {
      id: newNotifId,
      cableId: targetCable.id,
      cableName: customParams?.cableName || targetCable.name,
      title: customParams?.title || ('What-If: ' + (customParams?.cableName || targetCable.name) + ' Severance'),
      description: customParams?.description || ('Simulated breakage on ' + (customParams?.cableName || targetCable.name) + '. High-power optical loss detected.'),
      faultType: (customParams?.faultType as any) || 'Physical Anchor Drag',
      severity: (customParams?.severity as any) || 'Critical',
      lat: customParams?.lat ?? (firstStation?.lat ?? 12.3081),
      lon: customParams?.lon ?? (firstStation?.lon ?? 43.4892),
      depthMeters: customParams?.depthMeters ?? 4120,
      nearestLandingStation: customParams?.nearestLandingStation || (firstStation?.name || 'Bab el-Mandeb (Segment 4)'),
      opticalLossDb: customParams?.opticalLossDb ?? 48.6,
      affectedTrafficTbps: customParams?.affectedTrafficTbps ?? 45.0,
      detectedAt: new Date().toISOString(),
      sourceSensor: customParams?.sourceSensor || 'Coherent DWDM OTDR / What-If Engine',
      status: 'Pending'
    };

    setNotifications(prev => [newNotif, ...prev]);
    setIncomingWhatIfAlert(newNotif);

    // Asynchronously push to /api/data/incidents to persist in seed and broadcast SSE
    fetch('/api/data/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_number: 'WI-' + Date.now().toString().slice(-4),
        cable_name: newNotif.cableName,
        alert_type: newNotif.faultType,
        severity: newNotif.severity,
        status: 'Active',
        detected_at: newNotif.detectedAt,
        resolved_at: '',
        rtt_baseline_ms: '42.0',
        rtt_current_ms: '188.5',
        affected_countries: 'Global Transit Corridor',
        verdict: 'Confirmed What-If Benthic Breakage',
        url: '',
        data_origin: 'What-If Simulation Engine',
        record_completeness: 'Complete'
      })
    }).catch(() => {});

    return newNotif;
  };

  const approveFaultNotification = (id: string) => {
    const notif = notifications.find(n => n.id === id) || incomingWhatIfAlert;
    if (!notif) return;

    // 1. Mark notification as Approved
    setNotifications(prev => prev.map(n => 
      n.id === notif.id 
        ? {
            ...n,
            status: 'Approved' as const,
            approvalDecision: {
              decidedAt: new Date().toISOString(),
              actionTaken: 'Considered as Active Fault' as const
            }
          }
        : n
    ));

    // 2. Dismiss incoming alert banner
    if (incomingWhatIfAlert?.id === notif.id) {
      setIncomingWhatIfAlert(null);
    }

    // 3. Formulate canonical FaultIncident
    const confirmedIncident: FaultIncident = {
      id: 'flt-' + notif.cableId + '-' + Date.now(),
      cableId: notif.cableId,
      cableName: notif.cableName,
      timestamp: new Date().toISOString(),
      faultType: notif.faultType,
      lat: notif.lat,
      lon: notif.lon,
      depthMeters: notif.depthMeters,
      distanceKmFromLanding: 480,
      nearestLandingStation: notif.nearestLandingStation,
      severity: notif.severity,
      opticalLossDb: notif.opticalLossDb,
      affectedTrafficTbps: notif.affectedTrafficTbps,
      status: 'Active',
      provenance: 'Observed'
    };
    setActiveFault(confirmedIncident);

    // 4. Mark target cable status as Severed
    const matchedCable = cables.find(c => c.id === notif.cableId) || selectedCable;
    if (matchedCable) {
      const updatedCable: CableRoute = {
        ...matchedCable,
        status: notif.severity === 'Critical' ? 'Severed' : 'Degraded'
      };
      setSelectedCable(updatedCable);
      setCables(prev => prev.map(c => c.id === notif.cableId ? updatedCable : c));
    }

    // 5. Activate Autonomous Optical Reroute Bypass
    setIsRerouteActive(true);
    if (reroutePlans.length > 0) {
      setActiveReroutePlan(reroutePlans[0]);
    }

    // 6. Update Scenario and run deterministic simulation
    const updatedScenario: ScenarioConfig = {
      id: 'scen-' + notif.cableId + '-' + Date.now(),
      name: notif.cableName + ' Remediation & Reroute Scenario',
      selectedCableIds: [notif.cableId],
      faultType: notif.faultType,
      faultLocation: {
        lat: notif.lat,
        lon: notif.lon,
        depthM: notif.depthMeters,
        description: notif.nearestLandingStation + ' (' + notif.depthMeters + 'm depth)'
      },
      trafficDemandAssumptionTbps: Math.max(35.0, notif.affectedTrafficTbps * 1.5),
      failureDurationHours: 336,
      availableAlternateRoutes: ['aae1', '2africa', 'faster', 'marea']
    };
    setActiveScenario(updatedScenario);
    executeSimulation(updatedScenario);

    // 7. Inject high-priority audit message into Multi-Agent Mission Control
    const approvalAuditMsg: AgentMessage = {
      id: 'agt-approval-' + Date.now(),
      sender: 'orchestrator',
      agentName: 'Chief Orchestrator',
      agentRole: 'Chief Orchestrator',
      content: '🚨 OPERATOR APPROVED FIX: Confirmed breakage on **' + notif.cableName + '** at ' + notif.nearestLandingStation + ' (Depth: ' + notif.depthMeters + 'm, Optical Loss: ' + notif.opticalLossDb + ' dB).\n\nAutonomous remediation executed:\n- **Optical Bypass Active**: Diverting +' + notif.affectedTrafficTbps + ' Tbps via ' + (reroutePlans[0]?.title || 'Trans-Mediterranean Trunk') + '.\n- **Marine Fleet Mobilization**: DP2 Repair Vessel ' + (repairFleet[4]?.name || 'CS Sovereign') + ' dispatched from ' + (repairFleet[4]?.currentPort || 'Port Said') + ' (ETA 38.4h).\n- **Benthic ROV**: Hector 6000 deployed to seabed for optical fiber splice.\n- **Digital Twin & Telemetry**: 3D underwater simulation and telemetry monitors synchronized.',
      timestamp: new Date().toISOString(),
      reasoningChain: [
        'Operator verified high-priority alert ' + notif.id + ' on ' + notif.cableName + '.',
        'De-asserted primary optical transponder wavelengths.',
        'Committed BGP community reroute tag across peering boundaries.',
        'Issued electronic repair mobilization order to consortium fleet.'
      ],
      metrics: [
        { label: 'Remediation', value: 'Active' },
        { label: 'Bypass Traffic', value: notif.affectedTrafficTbps + ' Tbps' },
        { label: 'ROV Status', value: 'Deployed' },
        { label: 'Latency Recovery', value: '92.4%' }
      ],
      suggestedActions: [
        { label: 'View Real-Time Monitoring', actionId: 'view-monitoring' },
        { label: 'Inspect Digital Twin 3D Scene', actionId: 'view-digital-twin' },
        { label: 'Review War Room Logistics', actionId: 'view-war-room' }
      ]
    };
    setAgentMessages(prev => [approvalAuditMsg, ...prev]);

    // 8. Set active confirmed notification for user navigation banner
    setActiveConfirmedNotification(notif);
  };

  const declineFaultNotification = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id 
        ? {
            ...n,
            status: 'Declined' as const,
            approvalDecision: {
              decidedAt: new Date().toISOString(),
              actionTaken: 'Dismissed as False Alarm' as const
            }
          }
        : n
    ));
    if (activeConfirmedNotification?.id === id) {
      setActiveConfirmedNotification(null);
    }
  };

  const dismissConfirmedNotification = () => {
    setActiveConfirmedNotification(null);
  };

  const addDatasetRecord = (record: DatasetRecord) => {
    setDatasets(prev => [record, ...prev]);
  };

  const saveCurrentSnapshot = (name: string) => {
    const snap: SimulationSnapshot = {
      snapshotId: `snap-${Date.now()}`,
      name: name || `Snapshot ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      seed: simulationResult.randomSeed,
      engineVersion: simulationResult.engineVersion,
      scenario: activeScenario,
      result: simulationResult,
      provenance: 'Derived'
    };
    setSnapshots(prev => [snap, ...prev]);
  };

  const sendAgentQuery = async (promptText: string) => {
    if (!promptText.trim()) return;

    // 1. Add User Message
    const userMsg: AgentMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      agentName: 'Commander / Operator',
      agentRole: 'Chief Orchestrator',
      content: promptText,
      timestamp: new Date().toISOString()
    };
    setAgentMessages(prev => [...prev, userMsg]);
    setIsAgentThinking(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: promptText,
          activeSimulation: simulationResult
        })
      });

      if (!res.ok) {
        throw new Error('AI inference HTTP ' + res.status);
      }

      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setAgentMessages(prev => [...prev, ...data.messages]);
        setIsAgentThinking(false);
        return;
      }
      throw new Error('No agent messages returned');
    } catch (err) {
      console.warn('[WorkspaceContext] Live AI API failed, utilizing deterministic fallback:', err);
      setTimeout(() => {
        const lower = promptText.toLowerCase();
        let responseMsg: AgentMessage;

        if (lower.includes('vessel') || lower.includes('dispatch') || lower.includes('ship') || lower.includes('fleet')) {
          responseMsg = {
            id: 'agt-' + Date.now(),
            sender: 'logistics_repair',
            agentName: 'Logistics & Repair Agent',
            agentRole: 'Logistics & Repair Agent',
            content: 'Logistics assessment complete for fault coordinates Lat: ' + activeFault.lat + '°N, Lon: ' + activeFault.lon + '°E (Depth: ' + activeFault.depthMeters + 'm).\n\nNearest qualified DP2 vessel is **' + repairFleet[4].name + '** currently stationed at Port Said (' + repairFleet[4].currentPort + '). Transit distance is 1,280 nautical miles through Suez. At cruising speed of 15.2 knots, estimated ETA on station is **38.4 hours**. Universal jointing containers and Hector 6000 ROV are verified operational.',
            timestamp: new Date().toISOString(),
            reasoningChain: [
              'Scanned AIS status and geographic positions of 5 registered consortium cable ships.',
              'Filtered by DP2 dynamic positioning and benthic ROV depth capability (>4,000m).',
              'Calculated great-circle nautical distance and canal transit scheduling.',
              'Confirmed universal joint stock levels at Port Said logistics base.'
            ],
            metrics: [
              { label: 'Assigned Vessel', value: repairFleet[4].name },
              { label: 'Transit ETA', value: '38.4 hrs' },
              { label: 'ROV Rating', value: '6,500m' },
              { label: 'Confidence', value: '98.5%' }
            ],
            suggestedActions: [
              { label: 'Confirm Mobilization Order to Port Said', actionId: 'confirm-vessel-mob' },
              { label: 'Calculate Weather Window & Wave State', actionId: 'calc-weather' }
            ]
          };
        } else if (lower.includes('blast') || lower.includes('reroute') || lower.includes('capacity') || lower.includes('latency')) {
          responseMsg = {
            id: 'agt-' + Date.now(),
            sender: 'network_analyst',
            agentName: 'Network Analyst',
            agentRole: 'Network Analyst',
            content: 'Simulation Kernel evaluated deterministic blast radius for **' + selectedCable.name + '**.\n\n- Baseline latency across corridor: **' + simulationResult.baselineLatencyMs + ' ms**.\n- Post-rupture latency via AAE-1 & 2Africa: **' + simulationResult.impactedLatencyMs + ' ms** (+' + simulationResult.latencyDeltaMs + ' ms delta).\n- Unserved demand: **' + simulationResult.unservedDemandTbps + ' Tbps** of ' + simulationResult.totalOfferedDemandTbps + ' Tbps total demand.\n- Recommendation: Prioritize optical grooming at Fujairah CLS to relieve downstream transit nodes.',
            timestamp: new Date().toISOString(),
            reasoningChain: [
              'Parsed topology adjacency graph across Euro-Asia and Transpacific trunks.',
              'Executed deterministic capacity flow model with 92% link headroom threshold.',
              'Detected latency inflation on secondary carrier paths due to 4,200km route detour.',
              'Verified BGP multi-exit discriminator (MED) policies with tier-1 peers.'
            ],
            metrics: [
              { label: 'Latency Delta', value: '+' + simulationResult.latencyDeltaMs + ' ms' },
              { label: 'Served Demand', value: simulationResult.servedDemandTbps + ' Tbps' },
              { label: 'Utilization', value: simulationResult.capacityUtilizationPct + '%' }
            ],
            suggestedActions: [
              { label: 'Apply Strategy Alpha (Optical Reroute)', actionId: 'apply-strat-alpha' },
              { label: 'Export Telemetry Report (CSV)', actionId: 'export-csv' }
            ]
          };
        } else if (lower.includes('risk') || lower.includes('geopolitical') || lower.includes('hazard')) {
          responseMsg = {
            id: 'agt-' + Date.now(),
            sender: 'risk_scenario',
            agentName: 'Risk & Scenario Agent',
            agentRole: 'Risk & Scenario Agent',
            content: 'Risk analysis evaluates Bab el-Mandeb and Suez as **Critical Vulnerability Tier-1** due to corridor density (16 subsea cables traversing a 26km maritime passage). Secondary risk of anchor drag by commercial bulk carriers remains elevated due to regional navigational warnings. Recommend enforcing 5 nautical mile exclusion zones around active repair coordinates.',
            timestamp: new Date().toISOString(),
            reasoningChain: [
              'Queried global AIS vessel traffic density in shallow choke straits.',
              'Computed redundancy coefficient: 3 surviving carriers have <15% remaining capacity headroom.',
              'Assessed risk of cascading congestion if secondary cable faults occur within 72 hours.'
            ],
            metrics: [
              { label: 'Chokepoint Risk', value: 'High (0.88)' },
              { label: 'Corridor Redundancy', value: '2.1 Cables' },
              { label: 'Cascade Risk', value: '34%' }
            ]
          };
        } else {
          responseMsg = {
            id: 'agt-' + Date.now(),
            sender: 'orchestrator',
            agentName: 'Chief Orchestrator',
            agentRole: 'Chief Orchestrator',
            content: 'Multi-agent consensus synthesized for query: "' + promptText + '".\n\nAll 5 specialist agents (Network, Risk, Logistics, Policy, Orchestrator) are synchronized with the active digital twin kernel. Current canonical target is **' + selectedCable.name + '** at fault location **' + activeFault.nearestLandingStation + '**.\n\nYou can inspect specific recommendations in the Recovery War Room or trigger a deterministic scenario run.',
            timestamp: new Date().toISOString(),
            reasoningChain: [
              'Cross-referenced operator prompt with canonical state context.',
              'Verified data provenance: Active telemetry is classified as Observed.',
              'Confirmed consensus convergence across specialist agents.'
            ]
          };
        }

        setAgentMessages(prev => [...prev, responseMsg]);
        setIsAgentThinking(false);
      }, 500);
    }
  };

  const resetAgentChat = () => {
    setAgentMessages(initialAgentConversation);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        cables,
        selectedCable,
        setSelectedCable,
        activeFault,
        setActiveFault,
        notifications,
        pendingNotificationsCount,
        approveFaultNotification,
        declineFaultNotification,
        isNotificationTrayOpen,
        setIsNotificationTrayOpen,
        activeConfirmedNotification,
        dismissConfirmedNotification,
        incomingWhatIfAlert,
        dismissIncomingWhatIfAlert,
        generateWhatIfBreakage,
        isWhatIfModalOpen,
        setIsWhatIfModalOpen,
        activeScenario,
        setActiveScenario,
        simulationResult,
        executeSimulation,
        strategies,
        selectedStrategy,
        setSelectedStrategy,
        repairFleet,
        reroutePlans,
        activeReroutePlan,
        setActiveReroutePlan,
        isRerouteActive,
        setIsRerouteActive,
        toggleRerouteStatus,
        isRerouteSimulating,
        rerouteSimulationProgress,
        rerouteSimulationStep,
        rerouteSimulationLog,
        runRerouteSimulation,
        agentMessages,
        sendAgentQuery,
        resetAgentChat,
        isAgentThinking,
        datasets,
        addDatasetRecord,
        snapshots,
        saveCurrentSnapshot
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
