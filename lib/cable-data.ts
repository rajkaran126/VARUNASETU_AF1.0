import { CableRoute, LandingStation, FaultIncident, FaultNotification, RepairVessel, RecoveryStrategy, DatasetRecord, ReroutePlan, RerouteWaypoint } from './types';

export const VERIFIED_LANDING_STATIONS: LandingStation[] = [
  { id: 'cls-mumbai', name: 'Mumbai CLS (Versova/Prabhadevi)', city: 'Mumbai', country: 'India', region: 'South Asia', lat: 19.0760, lon: 72.8777, cablesConnected: ['smw4', 'smw5', 'aae1', 'bbg', 'fal'] },
  { id: 'cls-chennai', name: 'Chennai CLS (Santhome)', city: 'Chennai', country: 'India', region: 'South Asia', lat: 13.0827, lon: 80.2707, cablesConnected: ['smw4', 'i2i', 'bbg'] },
  { id: 'cls-marseille', name: 'Marseille Marine Terminal', city: 'Marseille', country: 'France', region: 'Southern Europe', lat: 43.2965, lon: 5.3698, cablesConnected: ['smw4', 'smw5', 'aae1', '2africa', 'peace'] },
  { id: 'cls-singapore', name: 'Tuas Cable Landing Station', city: 'Singapore', country: 'Singapore', region: 'Southeast Asia', lat: 1.3521, lon: 103.8198, cablesConnected: ['smw4', 'smw5', 'aae1', 'faster', 'unity', 'bifrost'] },
  { id: 'cls-djibouti', name: 'Djibouti Telecom Landing Base', city: 'Djibouti', country: 'Djibouti', region: 'East Africa / Red Sea', lat: 11.8251, lon: 42.5903, cablesConnected: ['smw5', 'aae1', '2africa', 'eassy'] },
  { id: 'cls-suez', name: 'Zafarana / Ras Ghareb CLS', city: 'Suez', country: 'Egypt', region: 'Red Sea Corridor', lat: 29.9668, lon: 32.5498, cablesConnected: ['smw4', 'smw5', 'aae1', 'peace'] },
  { id: 'cls-fujairah', name: 'Fujairah Marine Landing Hub', city: 'Fujairah', country: 'UAE', region: 'Middle East', lat: 25.1288, lon: 56.3265, cablesConnected: ['smw4', 'smw5', 'aae1', 'fal', 'tw1'] },
  { id: 'cls-bilbao', name: 'Sopelana CLS', city: 'Bilbao', country: 'Spain', region: 'Western Europe', lat: 43.3792, lon: -2.9818, cablesConnected: ['marea', 'grace-hopper'] },
  { id: 'cls-virginia-beach', name: 'Virginia Beach CLS', city: 'Virginia Beach', country: 'USA', region: 'North America East', lat: 36.8529, lon: -75.9780, cablesConnected: ['marea', 'dunant', 'amitie'] },
  { id: 'cls-bordeaux', name: 'Saint-Hilaire-de-Riez / Le Porge', city: 'Bordeaux', country: 'France', region: 'Western Europe', lat: 44.8378, lon: -0.5792, cablesConnected: ['dunant', 'amitie'] },
  { id: 'cls-shikoku', name: 'Chikura / Shima Cable Hub', city: 'Chiba', country: 'Japan', region: 'East Asia', lat: 34.9622, lon: 139.9577, cablesConnected: ['faster', 'unity', 'sjc2', 'juno'] },
  { id: 'cls-oregon', name: 'Bandon / Pacific City CLS', city: 'Oregon', country: 'USA', region: 'North America West', lat: 45.2040, lon: -123.9626, cablesConnected: ['faster', 'jupiter', 'curie'] },
  { id: 'cls-los-angeles', name: 'Hermosa Beach CLS', city: 'Los Angeles', country: 'USA', region: 'North America West', lat: 33.8622, lon: -118.3995, cablesConnected: ['unity', 'curie', 'bifrost'] },
  { id: 'cls-bude', name: 'Bude Subsea Terminal', city: 'Cornwall', country: 'UK', region: 'Western Europe', lat: 50.8266, lon: -4.5437, cablesConnected: ['grace-hopper', 'amitie', 'apollo'] },
  { id: 'cls-sydney', name: 'Brookvale / Alexandria CLS', city: 'Sydney', country: 'Australia', region: 'Oceania', lat: -33.8688, lon: 151.2093, cablesConnected: ['sx-next', 'indigo-central', 'hawaiki'] },
  { id: 'cls-cape-town', name: 'Melkbosstrand CLS', city: 'Cape Town', country: 'South Africa', region: 'Southern Africa', lat: -33.7231, lon: 18.4385, cablesConnected: ['2africa', 'wacs', 'sat3'] }
];

export const VERIFIED_CABLE_ROUTES: CableRoute[] = [
  {
    id: 'smw5',
    name: 'South East Asia-Middle East-Western Europe 5 (SEA-ME-WE 5)',
    rfsYear: 2016,
    lengthKm: 20000,
    designCapacityTbps: 24.0,
    litCapacityTbps: 18.5,
    fiberPairs: 3,
    owners: ['Orange', 'Telecom Italia Sparkle', 'Bharti Airtel', 'Singtel', 'Telecom Egypt', 'China Mobile'],
    status: 'Degraded',
    region: 'Euro-Asia / Indian Ocean',
    provenance: 'Observed',
    lastUpdated: '2026-10-30T07:15:00Z',
    knownIncidents: 4,
    notes: 'Primary Eurasian subsea trunkline traversing Bab el-Mandeb strait and Suez. Current optical telemetry displays high dispersion on Segment 4 (Red Sea).',
    landingStations: [
      VERIFIED_LANDING_STATIONS[3], // Singapore
      VERIFIED_LANDING_STATIONS[0], // Mumbai
      VERIFIED_LANDING_STATIONS[6], // Fujairah
      VERIFIED_LANDING_STATIONS[4], // Djibouti
      VERIFIED_LANDING_STATIONS[5], // Suez
      VERIFIED_LANDING_STATIONS[2], // Marseille
    ],
    routeCoordinates: [
      [103.8198, 1.3521],
      [95.2, 5.8],
      [80.2, 8.5],
      [72.8777, 19.0760],
      [56.3265, 25.1288],
      [50.5, 14.2],
      [42.5903, 11.8251],
      [38.4, 21.5],
      [32.5498, 29.9668],
      [25.0, 34.5],
      [15.2, 37.8],
      [5.3698, 43.2965]
    ]
  },
  {
    id: 'aae1',
    name: 'Asia Africa Europe-1 (AAE-1)',
    rfsYear: 2017,
    lengthKm: 25000,
    designCapacityTbps: 40.0,
    litCapacityTbps: 32.0,
    fiberPairs: 5,
    owners: ['China Unicom', 'Telecom Egypt', 'Etisalat', 'PCCW Global', 'VNPT', 'Retelit'],
    status: 'Operational',
    region: 'Euro-Asia / Indian Ocean',
    provenance: 'Observed',
    lastUpdated: '2026-10-29T18:40:00Z',
    knownIncidents: 2,
    notes: 'Longest subsea cable deployed in a decade connecting Asia to Europe with diverse overland crossings in Egypt.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[3], // Singapore
      VERIFIED_LANDING_STATIONS[0], // Mumbai
      VERIFIED_LANDING_STATIONS[6], // Fujairah
      VERIFIED_LANDING_STATIONS[4], // Djibouti
      VERIFIED_LANDING_STATIONS[5], // Suez
      VERIFIED_LANDING_STATIONS[2], // Marseille
    ],
    routeCoordinates: [
      [103.8198, 1.3521],
      [98.0, 4.0],
      [80.5, 6.0],
      [72.8777, 19.0760],
      [58.5, 22.0],
      [56.3265, 25.1288],
      [46.0, 12.5],
      [42.5903, 11.8251],
      [37.0, 24.0],
      [32.5498, 29.9668],
      [22.0, 35.0],
      [5.3698, 43.2965]
    ]
  },
  {
    id: 'marea',
    name: 'MAREA Subsea Cable System',
    rfsYear: 2018,
    lengthKm: 6605,
    designCapacityTbps: 200.0,
    litCapacityTbps: 160.0,
    fiberPairs: 8,
    owners: ['Telxius', 'Meta (Facebook)', 'Microsoft'],
    status: 'Operational',
    region: 'Transatlantic',
    provenance: 'Observed',
    lastUpdated: '2026-10-30T09:00:00Z',
    knownIncidents: 0,
    notes: 'Ultra-high-capacity transatlantic route laid south of historic North Atlantic choke corridors to maximize geographic diversity.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[8], // Virginia Beach
      VERIFIED_LANDING_STATIONS[7], // Bilbao
    ],
    routeCoordinates: [
      [-75.9780, 36.8529],
      [-65.0, 37.5],
      [-50.0, 39.0],
      [-35.0, 40.5],
      [-20.0, 41.5],
      [-10.0, 42.8],
      [-2.9818, 43.3792]
    ]
  },
  {
    id: 'dunant',
    name: 'Dunant Transatlantic Submarine Cable',
    rfsYear: 2021,
    lengthKm: 6400,
    designCapacityTbps: 250.0,
    litCapacityTbps: 210.0,
    fiberPairs: 12,
    owners: ['Google'],
    status: 'Operational',
    region: 'Transatlantic',
    provenance: 'Observed',
    lastUpdated: '2026-10-28T14:15:00Z',
    knownIncidents: 0,
    notes: 'First subsea cable to deploy 12-fiber-pair Space Division Multiplexing (SDM) architecture.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[8], // Virginia Beach
      VERIFIED_LANDING_STATIONS[9], // Bordeaux
    ],
    routeCoordinates: [
      [-75.9780, 36.8529],
      [-62.0, 39.0],
      [-48.0, 42.0],
      [-30.0, 44.5],
      [-15.0, 45.2],
      [-0.5792, 44.8378]
    ]
  },
  {
    id: 'faster',
    name: 'FASTER Cable System',
    rfsYear: 2016,
    lengthKm: 11629,
    designCapacityTbps: 60.0,
    litCapacityTbps: 52.0,
    fiberPairs: 6,
    owners: ['Google', 'China Mobile International', 'China Telecom Global', 'KDDI', 'Singtel'],
    status: 'Operational',
    region: 'Transpacific',
    provenance: 'Observed',
    lastUpdated: '2026-10-27T10:00:00Z',
    knownIncidents: 1,
    notes: 'High-bandwidth transpacific system landing in Oregon with direct branching into Chikura and Shima, Japan.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[11], // Oregon
      VERIFIED_LANDING_STATIONS[10], // Chiba / Chikura
    ],
    routeCoordinates: [
      [-123.9626, 45.2040],
      [-140.0, 48.0],
      [-160.0, 49.5],
      [-180.0, 48.5],
      [165.0, 45.0],
      [150.0, 40.0],
      [139.9577, 34.9622]
    ]
  },
  {
    id: 'unity',
    name: 'Unity / EAC-Pacific',
    rfsYear: 2010,
    lengthKm: 9620,
    designCapacityTbps: 7.68,
    litCapacityTbps: 7.68,
    fiberPairs: 5,
    owners: ['Google', 'Telstra', 'Singtel', 'KDDI', 'Bharti Airtel', 'TIME dotCom'],
    status: 'Operational',
    region: 'Transpacific',
    provenance: 'Observed',
    lastUpdated: '2026-10-25T11:20:00Z',
    knownIncidents: 3,
    notes: 'Pioneering consortium cable connecting Los Angeles with Chikura, Japan.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[12], // Los Angeles
      VERIFIED_LANDING_STATIONS[10], // Chiba / Chikura
    ],
    routeCoordinates: [
      [-118.3995, 33.8622],
      [-135.0, 36.0],
      [-155.0, 38.5],
      [-175.0, 39.0],
      [160.0, 38.0],
      [145.0, 36.5],
      [139.9577, 34.9622]
    ]
  },
  {
    id: '2africa',
    name: '2Africa Subsea Cable System',
    rfsYear: 2024,
    lengthKm: 45000,
    designCapacityTbps: 180.0,
    litCapacityTbps: 110.0,
    fiberPairs: 16,
    owners: ['Meta (Facebook)', 'Vodafone', 'Orange', 'China Mobile International', 'Telecom Egypt', 'MTN GlobalConnect'],
    status: 'Operational',
    region: 'Pan-African & Middle East',
    provenance: 'Observed',
    lastUpdated: '2026-10-30T08:30:00Z',
    knownIncidents: 1,
    notes: 'The longest subsea cable system ever constructed, encircling the African continent and interconnecting Europe and the Middle East.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[2],  // Marseille
      VERIFIED_LANDING_STATIONS[5],  // Suez
      VERIFIED_LANDING_STATIONS[4],  // Djibouti
      VERIFIED_LANDING_STATIONS[15], // Cape Town
    ],
    routeCoordinates: [
      [5.3698, 43.2965],
      [12.0, 35.0],
      [32.5498, 29.9668],
      [38.0, 20.0],
      [42.5903, 11.8251],
      [51.0, 2.0],
      [48.0, -10.0],
      [40.0, -22.0],
      [32.0, -30.0],
      [18.4385, -33.7231]
    ]
  },
  {
    id: 'sx-next',
    name: 'Southern Cross NEXT',
    rfsYear: 2022,
    lengthKm: 13700,
    designCapacityTbps: 72.0,
    litCapacityTbps: 45.0,
    fiberPairs: 4,
    owners: ['Southern Cross Cables', 'Telstra', 'Spark NZ', 'Singtel'],
    status: 'Operational',
    region: 'Oceania / Transpacific',
    provenance: 'Observed',
    lastUpdated: '2026-10-26T14:00:00Z',
    knownIncidents: 0,
    notes: 'Direct low-latency route between Sydney, Auckland, Fiji, and Los Angeles.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[14], // Sydney
      VERIFIED_LANDING_STATIONS[12], // Los Angeles
    ],
    routeCoordinates: [
      [151.2093, -33.8688],
      [165.0, -28.0],
      [178.0, -18.0],
      [-165.0, -5.0],
      [-145.0, 12.0],
      [-128.0, 25.0],
      [-118.3995, 33.8622]
    ]
  },
  {
    id: 'grace-hopper',
    name: 'Grace Hopper Cable System',
    rfsYear: 2022,
    lengthKm: 6250,
    designCapacityTbps: 340.0,
    litCapacityTbps: 240.0,
    fiberPairs: 16,
    owners: ['Google'],
    status: 'Operational',
    region: 'Transatlantic',
    provenance: 'Observed',
    lastUpdated: '2026-10-29T16:00:00Z',
    knownIncidents: 0,
    notes: 'Incorporates novel optical switching at the fiber layer to route around subsea impairments in the English Channel.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[8],  // Virginia Beach
      VERIFIED_LANDING_STATIONS[13], // Bude, UK
      VERIFIED_LANDING_STATIONS[7],  // Bilbao, Spain
    ],
    routeCoordinates: [
      [-75.9780, 36.8529],
      [-60.0, 40.0],
      [-42.0, 44.0],
      [-25.0, 47.0],
      [-10.0, 49.5],
      [-4.5437, 50.8266]
    ]
  },
  {
    id: 'smw4',
    name: 'South East Asia-Middle East-Western Europe 4 (SEA-ME-WE 4)',
    rfsYear: 2005,
    lengthKm: 18800,
    designCapacityTbps: 4.6,
    litCapacityTbps: 4.6,
    fiberPairs: 2,
    owners: ['Consortium of 16 telcos (Airtel, Orange, Tata, Singtel, Telecom Italia Sparkle)'],
    status: 'Severed',
    region: 'Euro-Asia / Indian Ocean',
    provenance: 'Observed',
    lastUpdated: '2026-10-30T06:12:00Z',
    knownIncidents: 8,
    notes: 'Legacy workhorse system currently experiencing physical severance in the Red Sea / Gulf of Aden corridor.',
    landingStations: [
      VERIFIED_LANDING_STATIONS[3], // Singapore
      VERIFIED_LANDING_STATIONS[1], // Chennai
      VERIFIED_LANDING_STATIONS[0], // Mumbai
      VERIFIED_LANDING_STATIONS[6], // Fujairah
      VERIFIED_LANDING_STATIONS[5], // Suez
      VERIFIED_LANDING_STATIONS[2], // Marseille
    ],
    routeCoordinates: [
      [103.8198, 1.3521],
      [90.0, 8.0],
      [80.2707, 13.0827],
      [75.0, 10.0],
      [72.8777, 19.0760],
      [60.0, 22.0],
      [56.3265, 25.1288],
      [45.0, 13.0],
      [32.5498, 29.9668],
      [15.0, 36.0],
      [5.3698, 43.2965]
    ]
  }
];

export const ACTIVE_FAULT_INCIDENTS: FaultIncident[] = [
  {
    id: 'flt-2026-smw4-01',
    cableId: 'smw4',
    cableName: 'SEA-ME-WE 4',
    timestamp: '2026-10-30T04:22:18Z',
    faultType: 'Physical Anchor Drag',
    lat: 12.3081,
    lon: 43.4892,
    depthMeters: 4120,
    distanceKmFromLanding: 640,
    nearestLandingStation: 'Djibouti CLS',
    severity: 'Critical',
    opticalLossDb: 42.8,
    affectedTrafficTbps: 4.6,
    status: 'Active',
    provenance: 'Observed'
  },
  {
    id: 'flt-2026-smw5-02',
    cableId: 'smw5',
    cableName: 'SEA-ME-WE 5',
    timestamp: '2026-10-30T05:48:00Z',
    faultType: 'Shunt Fault (Insulation Breakdown)',
    lat: 13.1120,
    lon: 43.1904,
    depthMeters: 3840,
    distanceKmFromLanding: 512,
    nearestLandingStation: 'Djibouti CLS',
    severity: 'Major',
    opticalLossDb: 18.4,
    affectedTrafficTbps: 9.2,
    status: 'Investigating',
    provenance: 'Observed'
  }
];

export const INITIAL_FAULT_NOTIFICATIONS: FaultNotification[] = [
  {
    id: 'notif-smw4-01',
    cableId: 'smw4',
    cableName: 'SEA-ME-WE 4',
    title: 'Severe Loss of Light Alarm (42.8 dB) — Bab el-Mandeb',
    description: 'OTDR telemetry detects sudden optical reflection spike at 640km mark from Djibouti CLS. Loss of signal (LOS) across 12 DWDM transponders.',
    faultType: 'Physical Anchor Drag',
    lat: 12.3081,
    lon: 43.4892,
    depthMeters: 4120,
    nearestLandingStation: 'Djibouti CLS',
    severity: 'Critical',
    opticalLossDb: 42.8,
    affectedTrafficTbps: 4.6,
    detectedAt: '2026-10-30T09:12:00Z',
    sourceSensor: 'OTDR Benthic Reflector Array #412',
    status: 'Pending'
  },
  {
    id: 'notif-smw5-02',
    cableId: 'smw5',
    cableName: 'SEA-ME-WE 5',
    title: 'Subsea Current Microbending Anomaly — Red Sea Segment 4',
    description: 'Coherent DSP detects sudden chromatic dispersion jump and 18.4 dB power attenuation. Pre-FEC BER degraded past nominal threshold.',
    faultType: 'Shunt Fault (Insulation Breakdown)',
    lat: 13.1120,
    lon: 43.1904,
    depthMeters: 3840,
    nearestLandingStation: 'Djibouti CLS',
    severity: 'Major',
    opticalLossDb: 18.4,
    affectedTrafficTbps: 9.2,
    detectedAt: '2026-10-30T09:25:30Z',
    sourceSensor: 'DWDM Coherent DSP Telemetry',
    status: 'Pending'
  },
  {
    id: 'notif-faster-03',
    cableId: 'faster',
    cableName: 'FASTER Cable System',
    title: 'Cascading Seismic Ground Shaking Alert — Japan Trench Subduction Zone',
    description: 'USGS subsea seismometer network reports 6.2 Mw benthic tremor within 45km of FASTER Chikura branch. Optical power currently stable but strain sensors triggered.',
    faultType: 'Benthic Rupture / Seismic',
    lat: 35.1200,
    lon: 142.4500,
    depthMeters: 5600,
    nearestLandingStation: 'Chikura / Shima CLS, Japan',
    severity: 'Moderate',
    opticalLossDb: 4.2,
    affectedTrafficTbps: 18.0,
    detectedAt: '2026-10-30T09:35:10Z',
    sourceSensor: 'Benthic Seismometer Array #8',
    status: 'Pending'
  }
];

export const REPAIR_FLEET: RepairVessel[] = [
  {
    id: 'vsl-sovereign',
    name: 'CS Sovereign',
    imo: '9004047',
    vesselType: 'Dedicated Subsea Cable Ship (DP2)',
    currentPort: 'Southampton, UK',
    lat: 50.8998,
    lon: -1.4044,
    status: 'Stationed at Port',
    dpRating: 'DP2',
    rovDepthRatingM: 4500,
    cableTankCapacityTonnes: 5500,
    cruisingSpeedKnots: 13.5,
    provenance: 'Observed',
    lastAisUpdate: '2026-10-30T08:00:00Z'
  },
  {
    id: 'vsl-dependable',
    name: 'CS Dependable',
    imo: '9238387',
    vesselType: 'Ocean-class Cable Layer & Repair',
    currentPort: 'Subic Bay, Philippines',
    lat: 14.8210,
    lon: 120.2789,
    status: 'Stationed at Port',
    dpRating: 'DP2',
    rovDepthRatingM: 6000,
    cableTankCapacityTonnes: 7000,
    cruisingSpeedKnots: 14.0,
    provenance: 'Observed',
    lastAisUpdate: '2026-10-30T07:45:00Z'
  },
  {
    id: 'vsl-innovator',
    name: 'Cable Innovator',
    imo: '9100061',
    vesselType: 'Purpose-Built Heavy Cable Ship',
    currentPort: 'Singapore Marine Hub',
    lat: 1.2903,
    lon: 103.8520,
    status: 'Mobilizing',
    dpRating: 'DP2',
    rovDepthRatingM: 5000,
    cableTankCapacityTonnes: 8500,
    cruisingSpeedKnots: 14.8,
    provenance: 'Observed',
    lastAisUpdate: '2026-10-30T09:10:00Z'
  },
  {
    id: 'vsl-lodbrok',
    name: 'CS Lodbrok',
    imo: '8207941',
    vesselType: 'Rapid Deployment Repair Ship',
    currentPort: 'Brest, France',
    lat: 48.3904,
    lon: -4.4861,
    status: 'Stationed at Port',
    dpRating: 'DP1',
    rovDepthRatingM: 3000,
    cableTankCapacityTonnes: 3200,
    cruisingSpeedKnots: 12.0,
    provenance: 'Observed',
    lastAisUpdate: '2026-10-30T06:30:00Z'
  },
  {
    id: 'vsl-ile-de-sein',
    name: 'Ile de Sein',
    imo: '9230414',
    vesselType: 'High-Tech Deepwater Cable Ship',
    currentPort: 'Port Said, Egypt',
    lat: 31.2653,
    lon: 32.3019,
    status: 'In Transit',
    dpRating: 'DP2',
    rovDepthRatingM: 6500,
    cableTankCapacityTonnes: 6000,
    cruisingSpeedKnots: 15.2,
    provenance: 'Observed',
    lastAisUpdate: '2026-10-30T09:25:00Z'
  }
];

export const INITIAL_RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    id: 'strat-a-optical-reroute',
    title: 'Strategy Alpha: Dynamic Multi-Carriage Optical Rerouting',
    strategyType: 'Optical Reroute',
    timeToExecute: '< 4 Minutes (Automated BGP & DWDM Switching)',
    capacityRestoredPct: 84.5,
    latencyImpactMs: 38.4,
    estimatedCostUsd: 145000,
    complexity: 'Low',
    feasibilityScorePct: 96,
    recommended: true,
    description: 'Switches impacted Mumbai-Marseille transits across AAE-1 and 2Africa optical conduits with automated spectral grooming at Fujairah and Suez landing stations.',
    actionSteps: [
      'Inject BGP community no-export attributes for compromised SEA-ME-WE 4 subnets',
      'Allocate 14.2 Tbps burst lambdas on AAE-1 consortium channels',
      'Establish bilateral carrier cross-connect at Marseille Interxion DC',
      'Verify SNR threshold (minimum 18.2 dB) on backup transponders'
    ]
  },
  {
    id: 'strat-b-transpacific-bypass',
    title: 'Strategy Bravo: Transpacific Geodiversity Spillover',
    strategyType: 'Carrier Grooming',
    timeToExecute: '1.5 Hours',
    capacityRestoredPct: 94.0,
    latencyImpactMs: 112.6,
    estimatedCostUsd: 380000,
    complexity: 'Medium',
    feasibilityScorePct: 88,
    recommended: false,
    description: 'Reroutes non-latency-sensitive bulk cloud sync and OTT content eastwards across FASTER and MAREA transoceanic systems, bypassing Eurasian choke-points entirely.',
    actionSteps: [
      'Partition latency-critical financial traffic from bulk database synchronisation streams',
      'Direct US-Europe eastbound flows via MAREA 8-fiber-pair trunk',
      'Route Asia-US traffic via FASTER transpacific corridor landing at Oregon',
      'Apply rate-limiting caps on non-essential peer transit'
    ]
  },
  {
    id: 'strat-c-deepsea-vessel-splice',
    title: 'Strategy Charlie: DP2 Vessel Mobilization & ROV Benthic Splice',
    strategyType: 'Physical Repair',
    timeToExecute: '11 - 14 Days (Transit + Benthic Operations)',
    capacityRestoredPct: 100.0,
    latencyImpactMs: 0.0,
    estimatedCostUsd: 2150000,
    complexity: 'High',
    feasibilityScorePct: 92,
    recommended: true,
    description: 'Dispatches CS Ile de Sein from Port Said with Hector 6000 ROV to perform acoustic beacon search, bight retrieval, atmospheric cleanroom fiber splice, and seabed re-burial.',
    actionSteps: [
      'Issue vessel mobilization order to CS Ile de Sein at Port Said (ETA to fault: 38 hours)',
      'Deploy ROV to 4,120m depth to survey seabed furrow and cut compromised armor steel',
      'Rig grapnel hook to haul cable ends to vessel deck cleanroom',
      'Splice 3x fiber pairs with universal jointing enclosure (UJ) and re-lay under tension'
    ]
  }
];

export const INITIAL_DATASETS: DatasetRecord[] = [
  {
    id: 'ds-global-cables-observed',
    name: 'Verified Global Subsea Cable Registry 2026',
    fileType: 'GeoJSON',
    rowCount: 426,
    fileSizeKb: 1420,
    uploadedAt: '2026-10-30T06:00:00Z',
    provenance: 'Observed',
    validationStatus: 'Valid',
    validationErrors: [],
    description: 'Authoritative routing coordinates, RFS year, capacity, and consortium owners for all international submarine systems.'
  },
  {
    id: 'ds-landing-stations-master',
    name: 'International Cable Landing Stations (CLS) Master Grid',
    fileType: 'JSON',
    rowCount: 1248,
    fileSizeKb: 680,
    uploadedAt: '2026-10-29T12:00:00Z',
    provenance: 'Observed',
    validationStatus: 'Valid',
    validationErrors: [],
    description: 'Precision GPS coordinates, terminal operators, and connected consortium subsea lines across 130 coastal sovereign territories.'
  },
  {
    id: 'ds-telemetry-optical-synthetic',
    name: 'Red Sea Benthic Optical Impairment Telemetry (Live Ingest)',
    fileType: 'CSV',
    rowCount: 8640,
    fileSizeKb: 450,
    uploadedAt: '2026-10-30T09:00:00Z',
    provenance: 'Derived',
    validationStatus: 'Valid',
    validationErrors: [],
    description: 'High-frequency optical power attenuation (dB), chromatic dispersion (ps/nm), and BGP flap logs derived from DWDM transponder monitors.'
  }
];

export const DETERMINED_REROUTE_PLANS: ReroutePlan[] = [
  {
    id: 'reroute-alpha-aae1-2africa',
    strategyId: 'strat-a-optical-reroute',
    title: 'Strategy Alpha: Dynamic Multi-Carriage Optical Reroute',
    targetCableId: 'smw4',
    targetFaultId: 'flt-smw4-red-sea-01',
    status: 'Determined & Active',
    determinedAt: '2026-10-30T09:12:00Z',
    bypassCorridorName: 'AAE-1 Overland & 2Africa Subsea Trunk Bypass',
    restoredCapacityTbps: 14.2,
    restoredCapacityPct: 84.5,
    latencyPenaltyMs: 38.4,
    operationalWindow: 'Active until CS Ile de Sein completes benthic splice',
    waypoints: [
      { id: 'wp-bom', name: 'Mumbai CLS (Origin)', lat: 19.0760, lon: 72.8777, type: 'Origin', status: 'Active' },
      { id: 'wp-fuj', name: 'Fujairah Marine Hub (Spectral Grooming)', lat: 25.1288, lon: 56.3265, type: 'Optical Grooming Node', status: 'Active' },
      { id: 'wp-arab', name: 'Arabian Peninsula Overland Conduit', lat: 26.5000, lon: 44.0000, type: 'Overland Diversion', status: 'Active' },
      { id: 'wp-suez', name: 'Suez Canal Terminal (Zafarana Transit)', lat: 29.9668, lon: 32.5498, type: 'Transshipment', status: 'Active' },
      { id: 'wp-mrs', name: 'Marseille Marine Terminal (Terminus)', lat: 43.2965, lon: 5.3698, type: 'Terminus', status: 'Active' },
    ],
    pathCoordinates: [
      [72.8777, 19.0760], // Mumbai
      [64.5, 21.2],       // Arabian Sea
      [56.3265, 25.1288], // Fujairah
      [47.0, 26.2],       // Overland corridor across Arabian Peninsula
      [38.5, 28.0],       // Sinai / Northern Red Sea
      [32.5498, 29.9668], // Suez
      [24.5, 34.2],       // Eastern Mediterranean
      [14.0, 37.8],       // Ionian / Sicilian Strait
      [5.3698, 43.2965]   // Marseille
    ],
    notes: 'Bypasses the compromised Bab el-Mandeb benthic slope by allocating 14.2 Tbps burst lambdas north through Fujairah and Egypt overland DWDM trunks.'
  },
  {
    id: 'reroute-bravo-transpacific',
    strategyId: 'strat-b-transpacific-bypass',
    title: 'Strategy Bravo: Transpacific Geodiversity Spillover',
    targetCableId: 'smw4',
    targetFaultId: 'flt-smw4-red-sea-01',
    status: 'Standby',
    determinedAt: '2026-10-30T09:14:00Z',
    bypassCorridorName: 'FASTER Transpacific + MAREA Transatlantic Global Ring',
    restoredCapacityTbps: 18.0,
    restoredCapacityPct: 94.0,
    latencyPenaltyMs: 112.6,
    operationalWindow: 'Secondary failover standby',
    waypoints: [
      { id: 'wp-bom-b', name: 'Mumbai CLS', lat: 19.0760, lon: 72.8777, type: 'Origin', status: 'Active' },
      { id: 'wp-sin', name: 'Singapore Tuas CLS', lat: 1.3521, lon: 103.8198, type: 'Optical Grooming Node', status: 'Active' },
      { id: 'wp-tyo', name: 'Chikura Hub, Japan', lat: 34.9622, lon: 139.9577, type: 'Transshipment', status: 'Active' },
      { id: 'wp-ore', name: 'Pacific City, Oregon', lat: 45.2040, lon: -123.9626, type: 'Transshipment', status: 'Active' },
      { id: 'wp-vab', name: 'Virginia Beach CLS', lat: 36.8529, lon: -75.9780, type: 'Transshipment', status: 'Active' },
      { id: 'wp-mrs-b', name: 'Marseille Terminal', lat: 43.2965, lon: 5.3698, type: 'Terminus', status: 'Active' }
    ],
    pathCoordinates: [
      [72.8777, 19.0760],
      [80.0, 6.0],
      [98.0, 4.0],
      [103.8198, 1.3521],
      [118.0, 18.0],
      [139.9577, 34.9622],
      [-170.0, 42.0],
      [-123.9626, 45.2040],
      [-100.0, 40.0],
      [-75.9780, 36.8529],
      [-40.0, 41.0],
      [-2.9818, 43.3792],
      [5.3698, 43.2965]
    ],
    notes: 'Transfers bulk cloud replication and asynchronous payload across the global Pacific/Atlantic ring, bypassing Eurasia entirely.'
  }
];

