import { 
  MineInfo, 
  MinePanel, 
  GatewayInfo, 
  CentralAlert, 
  TrendMetricPoint, 
  PredictedRiskData, 
  ReportItem,
  SensorPlacementData,
  NodeRelocationItem,
  ComplianceItem
} from '../types/central';
import { MonitoringNode, NodeTier } from '../types';

export const centralMinesList: MineInfo[] = [
  {
    id: 'MINE-01',
    name: 'Jharia Colliery Block-IV',
    colliery: 'Bharat Coking Coal Limited (BCCL)',
    location: 'Dhanbad District, Jharkhand, India',
    coordinates: [23.758, 86.415],
    status: 'OPERATIONAL',
    totalPanels: 5,
    totalGateways: 8,
    totalNodes: 240,
    overallRisk: 'CRITICAL', // Driven by Panel P-03
    lastSyncTime: 'Just now'
  },
  {
    id: 'MINE-02',
    name: 'Raniganj Underground Seam-IX',
    colliery: 'Eastern Coalfields Limited (ECL)',
    location: 'Paschim Bardhaman, West Bengal, India',
    coordinates: [23.620, 87.120],
    status: 'OPERATIONAL',
    totalPanels: 3,
    totalGateways: 4,
    totalNodes: 120,
    overallRisk: 'WARNING',
    lastSyncTime: '2m ago'
  }
];

export const centralPanels: MinePanel[] = [
  // MINE-01 PANELS
  {
    id: 'P-01',
    name: 'North Longwall Panel 01',
    mineId: 'MINE-01',
    depthMeters: 260,
    status: 'ACTIVE',
    riskLevel: 'WARNING',
    riskScore: 68,
    maxDeformationMm: 34.8,
    gateways: ['GW-01', 'GW-02'],
    totalNodes: 54,
    onlineNodes: 52,
    warningCount: 3,
    criticalCount: 0,
    lastUpdated: '10:42 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.766, 86.408],
        [23.774, 86.418],
        [23.769, 86.425],
        [23.761, 86.415],
        [23.766, 86.408]
      ]
    }
  },
  {
    id: 'P-02',
    name: 'East Extraction Panel 02',
    mineId: 'MINE-01',
    depthMeters: 310,
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    riskScore: 24,
    maxDeformationMm: 9.2,
    gateways: ['GW-03'],
    totalNodes: 42,
    onlineNodes: 41,
    warningCount: 1,
    criticalCount: 0,
    lastUpdated: '10:41 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.759, 86.422],
        [23.767, 86.432],
        [23.761, 86.438],
        [23.753, 86.428],
        [23.759, 86.422]
      ]
    }
  },
  {
    id: 'P-03',
    name: 'South Subsidence Panel 03',
    mineId: 'MINE-01',
    depthMeters: 220,
    status: 'HIGH_ATTENTION',
    riskLevel: 'CRITICAL',
    riskScore: 92,
    maxDeformationMm: 74.6,
    gateways: ['GW-04', 'GW-05'],
    totalNodes: 68,
    onlineNodes: 65,
    warningCount: 8,
    criticalCount: 2,
    lastUpdated: '10:42 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.748, 86.410],
        [23.756, 86.421],
        [23.750, 86.428],
        [23.742, 86.417],
        [23.748, 86.410]
      ]
    }
  },
  {
    id: 'P-04',
    name: 'West Barrier Panel 04',
    mineId: 'MINE-01',
    depthMeters: 340,
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    riskScore: 18,
    maxDeformationMm: 6.4,
    gateways: ['GW-06'],
    totalNodes: 36,
    onlineNodes: 34,
    warningCount: 0,
    criticalCount: 0,
    lastUpdated: '10:38 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.752, 86.398],
        [23.760, 86.407],
        [23.755, 86.412],
        [23.747, 86.403],
        [23.752, 86.398]
      ]
    }
  },
  {
    id: 'P-05',
    name: 'Central Pillar Panel 05',
    mineId: 'MINE-01',
    depthMeters: 285,
    status: 'ACTIVE',
    riskLevel: 'WARNING',
    riskScore: 59,
    maxDeformationMm: 28.1,
    gateways: ['GW-07', 'GW-08'],
    totalNodes: 40,
    onlineNodes: 39,
    warningCount: 2,
    criticalCount: 0,
    lastUpdated: '10:40 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.755, 86.412],
        [23.763, 86.422],
        [23.758, 86.427],
        [23.750, 86.417],
        [23.755, 86.412]
      ]
    }
  },

  // MINE-02 PANELS
  {
    id: 'P-01',
    name: 'South Longwall Panel 01 (Raniganj)',
    mineId: 'MINE-02',
    depthMeters: 320,
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    riskScore: 30,
    maxDeformationMm: 11.2,
    gateways: ['GW-01', 'GW-02'],
    totalNodes: 45,
    onlineNodes: 44,
    warningCount: 1,
    criticalCount: 0,
    lastUpdated: '10:35 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.615, 87.112],
        [23.625, 87.118],
        [23.620, 87.126],
        [23.610, 87.120],
        [23.615, 87.112]
      ]
    }
  },
  {
    id: 'P-02',
    name: 'East Barrier Panel 02 (Raniganj)',
    mineId: 'MINE-02',
    depthMeters: 370,
    status: 'ACTIVE',
    riskLevel: 'WARNING',
    riskScore: 62,
    maxDeformationMm: 31.5,
    gateways: ['GW-03'],
    totalNodes: 40,
    onlineNodes: 38,
    warningCount: 2,
    criticalCount: 0,
    lastUpdated: '10:39 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.622, 87.125],
        [23.630, 87.132],
        [23.625, 87.140],
        [23.618, 87.132],
        [23.622, 87.125]
      ]
    }
  },
  {
    id: 'P-03',
    name: 'North Extraction Panel 03 (Raniganj)',
    mineId: 'MINE-02',
    depthMeters: 290,
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    riskScore: 21,
    maxDeformationMm: 8.4,
    gateways: ['GW-04'],
    totalNodes: 35,
    onlineNodes: 35,
    warningCount: 0,
    criticalCount: 0,
    lastUpdated: '10:30 AM',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [23.628, 87.110],
        [23.638, 87.118],
        [23.632, 87.125],
        [23.622, 87.118],
        [23.628, 87.110]
      ]
    }
  }
];

export const centralGateways: GatewayInfo[] = [
  // MINE-01 Gateways
  {
    id: 'GW-01',
    name: 'Gateway North-01',
    mineId: 'MINE-01',
    panelId: 'P-01',
    meshId: 'MESH-01',
    ipAddress: '10.14.20.11',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 12000).toISOString(),
    lastSyncSecondsAgo: 12,
    connectedNodes: 28,
    totalNodes: 28,
    meshHealth: 'GOOD',
    signalStrengthDbm: -68,
    batteryLevel: 98,
    currentRisk: 'WARNING',
    firmwareVersion: 'v2.4.1',
    latitude: 23.768,
    longitude: 86.414,
    packetSuccessRate: 99.2,
    latencyMs: 120
  },
  {
    id: 'GW-02',
    name: 'Gateway North-02',
    mineId: 'MINE-01',
    panelId: 'P-01',
    meshId: 'MESH-02',
    ipAddress: '10.14.20.12',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 18000).toISOString(),
    lastSyncSecondsAgo: 18,
    connectedNodes: 24,
    totalNodes: 26,
    meshHealth: 'EXCELLENT',
    signalStrengthDbm: -62,
    batteryLevel: 94,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.771,
    longitude: 86.420,
    packetSuccessRate: 99.8,
    latencyMs: 85
  },
  {
    id: 'GW-03',
    name: 'Gateway East-01',
    mineId: 'MINE-01',
    panelId: 'P-02',
    meshId: 'MESH-03',
    ipAddress: '10.14.20.21',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 22000).toISOString(),
    lastSyncSecondsAgo: 22,
    connectedNodes: 41,
    totalNodes: 42,
    meshHealth: 'GOOD',
    signalStrengthDbm: -72,
    batteryLevel: 96,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.761,
    longitude: 86.430,
    packetSuccessRate: 98.9,
    latencyMs: 140
  },
  {
    id: 'GW-04',
    name: 'Gateway South-01',
    mineId: 'MINE-01',
    panelId: 'P-03',
    meshId: 'MESH-04',
    ipAddress: '10.14.20.31',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 15000).toISOString(),
    lastSyncSecondsAgo: 15,
    connectedNodes: 33,
    totalNodes: 34,
    meshHealth: 'FAIR',
    signalStrengthDbm: -78,
    batteryLevel: 91,
    currentRisk: 'WARNING',
    firmwareVersion: 'v2.4.1',
    latitude: 23.752,
    longitude: 86.416,
    packetSuccessRate: 96.4,
    latencyMs: 210
  },
  {
    id: 'GW-05',
    name: 'Gateway South-02',
    mineId: 'MINE-01',
    panelId: 'P-03',
    meshId: 'MESH-05',
    ipAddress: '10.14.20.32',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 9000).toISOString(),
    lastSyncSecondsAgo: 9,
    connectedNodes: 32,
    totalNodes: 34,
    meshHealth: 'GOOD',
    signalStrengthDbm: -65,
    batteryLevel: 95,
    currentRisk: 'CRITICAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.746,
    longitude: 86.422,
    packetSuccessRate: 99.1,
    latencyMs: 110
  },
  {
    id: 'GW-06',
    name: 'Gateway West-01',
    mineId: 'MINE-01',
    panelId: 'P-04',
    meshId: 'MESH-06',
    ipAddress: '10.14.20.41',
    status: 'ONLINE',
    syncStatus: 'DELAYED',
    lastSyncTimestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    lastSyncSecondsAgo: 240,
    connectedNodes: 34,
    totalNodes: 36,
    meshHealth: 'FAIR',
    signalStrengthDbm: -84,
    batteryLevel: 82,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.3.9',
    latitude: 23.754,
    longitude: 86.404,
    packetSuccessRate: 92.5,
    latencyMs: 450
  },
  {
    id: 'GW-07',
    name: 'Gateway Central-01',
    mineId: 'MINE-01',
    panelId: 'P-05',
    meshId: 'MESH-07',
    ipAddress: '10.14.20.51',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 14000).toISOString(),
    lastSyncSecondsAgo: 14,
    connectedNodes: 20,
    totalNodes: 20,
    meshHealth: 'EXCELLENT',
    signalStrengthDbm: -60,
    batteryLevel: 99,
    currentRisk: 'WARNING',
    firmwareVersion: 'v2.4.1',
    latitude: 23.756,
    longitude: 86.417,
    packetSuccessRate: 99.9,
    latencyMs: 70
  },
  {
    id: 'GW-08',
    name: 'Gateway Central-02',
    mineId: 'MINE-01',
    panelId: 'P-05',
    meshId: 'MESH-08',
    ipAddress: '10.14.20.52',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 28000).toISOString(),
    lastSyncSecondsAgo: 28,
    connectedNodes: 19,
    totalNodes: 20,
    meshHealth: 'GOOD',
    signalStrengthDbm: -69,
    batteryLevel: 93,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.760,
    longitude: 86.421,
    packetSuccessRate: 98.4,
    latencyMs: 130
  },

  // MINE-02 Gateways
  {
    id: 'GW-01',
    name: 'Raniganj Gateway-01',
    mineId: 'MINE-02',
    panelId: 'P-01',
    meshId: 'MESH-01',
    ipAddress: '10.22.10.1',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 15000).toISOString(),
    lastSyncSecondsAgo: 15,
    connectedNodes: 22,
    totalNodes: 23,
    meshHealth: 'GOOD',
    signalStrengthDbm: -66,
    batteryLevel: 95,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.618,
    longitude: 87.115,
    packetSuccessRate: 98.7,
    latencyMs: 115
  },
  {
    id: 'GW-02',
    name: 'Raniganj Gateway-02',
    mineId: 'MINE-02',
    panelId: 'P-01',
    meshId: 'MESH-02',
    ipAddress: '10.22.10.2',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 20000).toISOString(),
    lastSyncSecondsAgo: 20,
    connectedNodes: 22,
    totalNodes: 22,
    meshHealth: 'EXCELLENT',
    signalStrengthDbm: -60,
    batteryLevel: 97,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.621,
    longitude: 87.121,
    packetSuccessRate: 99.5,
    latencyMs: 90
  },
  {
    id: 'GW-03',
    name: 'Raniganj Gateway-03',
    mineId: 'MINE-02',
    panelId: 'P-02',
    meshId: 'MESH-03',
    ipAddress: '10.22.10.3',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 30000).toISOString(),
    lastSyncSecondsAgo: 30,
    connectedNodes: 38,
    totalNodes: 40,
    meshHealth: 'GOOD',
    signalStrengthDbm: -70,
    batteryLevel: 92,
    currentRisk: 'WARNING',
    firmwareVersion: 'v2.4.1',
    latitude: 23.626,
    longitude: 87.130,
    packetSuccessRate: 97.8,
    latencyMs: 160
  },
  {
    id: 'GW-04',
    name: 'Raniganj Gateway-04',
    mineId: 'MINE-02',
    panelId: 'P-03',
    meshId: 'MESH-04',
    ipAddress: '10.22.10.4',
    status: 'ONLINE',
    syncStatus: 'SYNCED',
    lastSyncTimestamp: new Date(Date.now() - 10000).toISOString(),
    lastSyncSecondsAgo: 10,
    connectedNodes: 35,
    totalNodes: 35,
    meshHealth: 'EXCELLENT',
    signalStrengthDbm: -58,
    batteryLevel: 99,
    currentRisk: 'NORMAL',
    firmwareVersion: 'v2.4.1',
    latitude: 23.630,
    longitude: 87.116,
    packetSuccessRate: 99.8,
    latencyMs: 80
  }
];

// Generate structured nodes for MINE-01 and MINE-02
export const centralNodes: MonitoringNode[] = (() => {
  const nodes: MonitoringNode[] = [];
  let globalIndex = 1;

  // MINE-01 Nodes (240 nodes)
  const mine1Configs: { panelId: string; gateways: { gwId: string; meshId: string; center: [number, number]; count: number }[] }[] = [
    {
      panelId: 'P-01',
      gateways: [
        { gwId: 'GW-01', meshId: 'MESH-01', center: [23.768, 86.414], count: 28 },
        { gwId: 'GW-02', meshId: 'MESH-02', center: [23.771, 86.420], count: 26 }
      ]
    },
    {
      panelId: 'P-02',
      gateways: [
        { gwId: 'GW-03', meshId: 'MESH-03', center: [23.761, 86.430], count: 42 }
      ]
    },
    {
      panelId: 'P-03', // Critical Panel with high displacement
      gateways: [
        { gwId: 'GW-04', meshId: 'MESH-04', center: [23.752, 86.416], count: 34 },
        { gwId: 'GW-05', meshId: 'MESH-05', center: [23.746, 86.422], count: 34 }
      ]
    },
    {
      panelId: 'P-04',
      gateways: [
        { gwId: 'GW-06', meshId: 'MESH-06', center: [23.754, 86.404], count: 36 }
      ]
    },
    {
      panelId: 'P-05',
      gateways: [
        { gwId: 'GW-07', meshId: 'MESH-07', center: [23.756, 86.417], count: 20 },
        { gwId: 'GW-08', meshId: 'MESH-08', center: [23.760, 86.421], count: 20 }
      ]
    }
  ];

  mine1Configs.forEach(pConf => {
    pConf.gateways.forEach(gConf => {
      for (let i = 0; i < gConf.count; i++) {
        const id = `N${globalIndex.toString().padStart(3, '0')}`;
        const latOffset = (Math.sin(globalIndex * 1.7) * 0.0035) + (Math.cos(i * 0.9) * 0.002);
        const lngOffset = (Math.cos(globalIndex * 1.3) * 0.004) + (Math.sin(i * 0.8) * 0.0025);
        const lat = parseFloat((gConf.center[0] + latOffset).toFixed(6));
        const lng = parseFloat((gConf.center[1] + lngOffset).toFixed(6));

        let nodeTier: NodeTier = 'Tier-1 (Surface Extensometer)';
        let nodeType = 'Surface MPBX Extensometer';
        if (i % 3 === 1) {
          nodeTier = 'Tier-2 (Sub-Surface MPBX)';
          nodeType = 'Sub-Surface Multi-Point Extensometer';
        } else if (i % 3 === 2) {
          nodeTier = 'Tier-3 (In-Seam Multi-Param)';
          nodeType = 'In-Seam Tilt & Seismic Monitor';
        }

        let status: MonitoringNode['status'] = 'normal';
        let displacement = parseFloat((Math.random() * 8 + 2).toFixed(1));
        let tilt = parseFloat((Math.random() * 1.2 + 0.1).toFixed(2));
        let vibration = parseFloat((Math.random() * 0.4 + 0.05).toFixed(2));
        let crackWidthMm = 0;
        let crackDetected = false;

        if (pConf.panelId === 'P-03') {
          if (id === 'N127' || id === 'N148') {
            status = 'critical';
            displacement = id === 'N127' ? 74.6 : 68.2;
            tilt = 4.85;
            vibration = 1.95;
            crackDetected = true;
            crackWidthMm = 6.8;
          } else if (i % 4 === 0) {
            status = 'warning';
            displacement = parseFloat((Math.random() * 20 + 35).toFixed(1));
            tilt = parseFloat((Math.random() * 2 + 2.2).toFixed(2));
            crackDetected = Math.random() > 0.5;
            crackWidthMm = crackDetected ? 2.4 : 0;
          }
        } else if (pConf.panelId === 'P-01' && (i === 4 || i === 12)) {
          status = 'warning';
          displacement = 34.8;
          tilt = 2.4;
        } else if (pConf.panelId === 'P-05' && i === 7) {
          status = 'warning';
          displacement = 28.1;
        }

        if (id === 'N042' || id === 'N188' || id === 'N194' || id === 'N077' || id === 'N231') {
          status = 'offline';
        }

        const battery = status === 'offline' ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 35) + 65;
        const signalDbm = -55 - Math.floor(Math.random() * 35);

        nodes.push({
          id,
          name: `${id} - ${nodeTier.split(' ')[0]}`,
          latitude: lat,
          longitude: lng,
          nodeType,
          nodeTier,
          tilt,
          displacement,
          vibration,
          crackDetected,
          crackWidthMm,
          battery,
          signalDbm,
          status,
          riskScore: status === 'critical' ? 95 : status === 'warning' ? 68 : status === 'offline' ? 0 : 20,
          riskConfidence: 0.88,
          lastUpdated: '10:42 AM',
          lastSeenAgo: status === 'offline' ? '1 hour ago' : '15 sec ago',
          mineId: 'MINE-01',
          panelId: pConf.panelId,
          gatewayId: gConf.gwId,
          meshId: gConf.meshId,
          zoneId: `ZONE-${pConf.panelId}`,
          zoneName: `${pConf.panelId} Sector Zone`
        });

        globalIndex++;
      }
    });
  });

  // MINE-02 Nodes (120 nodes)
  const mine2Configs = [
    { panelId: 'P-01', gwId: 'GW-01', meshId: 'MESH-01', center: [23.618, 87.115], count: 23 },
    { panelId: 'P-01', gwId: 'GW-02', meshId: 'MESH-02', center: [23.621, 87.121], count: 22 },
    { panelId: 'P-02', gwId: 'GW-03', meshId: 'MESH-03', center: [23.626, 87.130], count: 40 },
    { panelId: 'P-03', gwId: 'GW-04', meshId: 'MESH-04', center: [23.630, 87.116], count: 35 }
  ];

  let mine2Index = 1;
  mine2Configs.forEach(conf => {
    for (let i = 0; i < conf.count; i++) {
      const id = `RN${mine2Index.toString().padStart(3, '0')}`;
      const lat = parseFloat((conf.center[0] + (Math.sin(i * 1.5) * 0.003)).toFixed(6));
      const lng = parseFloat((conf.center[1] + (Math.cos(i * 1.5) * 0.003)).toFixed(6));
      
      const status: MonitoringNode['status'] = (conf.panelId === 'P-02' && i === 5) ? 'warning' : (i === 18 ? 'offline' : 'normal');

      nodes.push({
        id,
        name: `${id} - Raniganj Node`,
        latitude: lat,
        longitude: lng,
        nodeType: 'Surface Multi-Parameter Node',
        nodeTier: 'Tier-1 (Surface Extensometer)',
        tilt: 0.25,
        displacement: 4.2,
        vibration: 0.12,
        crackDetected: false,
        battery: 88,
        signalDbm: -64,
        status,
        riskScore: status === 'warning' ? 62 : 18,
        riskConfidence: 0.92,
        lastUpdated: '10:35 AM',
        lastSeenAgo: '30s ago',
        mineId: 'MINE-02',
        panelId: conf.panelId,
        gatewayId: conf.gwId,
        meshId: conf.meshId,
        zoneId: `ZONE-M2-${conf.panelId}`,
        zoneName: `Raniganj ${conf.panelId}`
      });
      mine2Index++;
    }
  });

  return nodes;
})();

export const centralAlerts: CentralAlert[] = [
  {
    id: 'CALERT-001',
    severity: 'critical',
    title: 'Rapid Subsidence Rate Exceeded',
    message: 'Node N127 recorded continuous acceleration in downward displacement reaching 74.6mm.',
    mineId: 'MINE-01',
    panelId: 'P-03',
    gatewayId: 'GW-05',
    meshId: 'MESH-05',
    nodeId: 'N127',
    recommendedAction: 'Immediate evacuation of Section 3 working face and halt longwall shearer operations.',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    status: 'active',
    confidencePercent: 94,
    type: 'displacement'
  },
  {
    id: 'CALERT-002',
    severity: 'critical',
    title: 'Major Roof Bed Separation & Tension Crack',
    message: 'Node N148 detected multi-point extensometer anchor release and 6.8mm surface fissure opening.',
    mineId: 'MINE-01',
    panelId: 'P-03',
    gatewayId: 'GW-05',
    meshId: 'MESH-05',
    nodeId: 'N148',
    recommendedAction: 'Dispatch Geotechnical Safety Team to inspect barrier pillar integrity.',
    timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
    status: 'active',
    confidencePercent: 91,
    type: 'crack'
  },
  {
    id: 'CALERT-003',
    severity: 'high',
    title: 'Abnormal Strata Tilt Acceleration',
    message: 'Gateway GW-04 sub-mesh nodes show synchronized angular displacement exceeding 4.8°.',
    mineId: 'MINE-01',
    panelId: 'P-03',
    gatewayId: 'GW-04',
    meshId: 'MESH-04',
    nodeId: 'N112',
    recommendedAction: 'Verify hydraulic support pressure levels and check secondary support bolts.',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'acknowledged',
    confidencePercent: 86,
    type: 'tilt'
  },
  {
    id: 'CALERT-004',
    severity: 'high',
    title: 'Extensometer Displacement Threshold Warning',
    message: 'Panel P-01 boundary node N018 reached 34.8mm cumulative surface deformation.',
    mineId: 'MINE-01',
    panelId: 'P-01',
    gatewayId: 'GW-01',
    meshId: 'MESH-01',
    nodeId: 'N018',
    recommendedAction: 'Schedule surveyor cross-validation at Surface Monument BM-14.',
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    status: 'acknowledged',
    confidencePercent: 82,
    type: 'displacement'
  },
  {
    id: 'CALERT-005',
    severity: 'medium',
    title: 'Gateway Synchronization Latency Delay',
    message: 'Gateway GW-06 backhaul link experiencing packet retry delays (last synced 4m ago).',
    mineId: 'MINE-01',
    panelId: 'P-04',
    gatewayId: 'GW-06',
    meshId: 'MESH-06',
    recommendedAction: 'Inspect optical fiber repeater or cellular booster at Shaft No. 2 surface station.',
    timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    status: 'active',
    confidencePercent: 78,
    type: 'gateway_sync'
  },
  {
    id: 'CALERT-006',
    severity: 'low',
    title: 'Low Battery Level on Boundary Extensometer',
    message: 'Node N077 battery dropped to 14%. Solar trickle charging degraded.',
    mineId: 'MINE-01',
    panelId: 'P-02',
    gatewayId: 'GW-03',
    meshId: 'MESH-03',
    nodeId: 'N077',
    recommendedAction: 'Replace battery pack during routine shift change maintenance.',
    timestamp: new Date(Date.now() - 140 * 60000).toISOString(),
    status: 'resolved',
    confidencePercent: 99,
    type: 'system'
  },
  // MINE-02 Alerts
  {
    id: 'CALERT-007',
    severity: 'high',
    title: 'Raniganj Panel P-02 Barrier Stress Anomaly',
    message: 'Node RN045 detected 31.5mm displacement along East Fault boundary line.',
    mineId: 'MINE-02',
    panelId: 'P-02',
    gatewayId: 'GW-03',
    meshId: 'MESH-03',
    nodeId: 'RN045',
    recommendedAction: 'Conduct borehole endoscopic inspection along Pillar 14.',
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    status: 'active',
    confidencePercent: 88,
    type: 'displacement'
  }
];

export const panelSensorPlacementData: Record<string, SensorPlacementData> = {
  'MINE-01:P-03': {
    mineId: 'MINE-01',
    panelId: 'P-03',
    panelName: 'South Subsidence Panel 03',
    totalPlannedNodes: 80,
    installedNodes: 68,
    proposedNodesCount: 12,
    coveragePercent: 91.5,
    estimatedCostINR: '₹ 4,80,000',
    algorithmStatus: 'ANALYSIS_COMPLETE',
    proposedPoints: [
      {
        id: 'PROP-P03-01',
        nodeTier: 'Tier-1 (Surface Extensometer)',
        latitude: 23.747,
        longitude: 86.414,
        confidence: 0.94,
        priority: 'HIGH',
        purpose: 'Capture high strain gradient at South Goaf margin',
        estimatedCostINR: 35000
      },
      {
        id: 'PROP-P03-02',
        nodeTier: 'Tier-2 (Sub-Surface MPBX)',
        latitude: 23.753,
        longitude: 86.420,
        confidence: 0.91,
        priority: 'HIGH',
        purpose: 'Monitor delamination near fault plane intersection',
        estimatedCostINR: 55000
      },
      {
        id: 'PROP-P03-03',
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        latitude: 23.749,
        longitude: 86.425,
        confidence: 0.88,
        priority: 'MEDIUM',
        purpose: 'Detect acoustic emissions and micro-seismic precursor',
        estimatedCostINR: 42000
      }
    ]
  },
  'MINE-01:P-01': {
    mineId: 'MINE-01',
    panelId: 'P-01',
    panelName: 'North Longwall Panel 01',
    totalPlannedNodes: 60,
    installedNodes: 54,
    proposedNodesCount: 6,
    coveragePercent: 94.0,
    estimatedCostINR: '₹ 2,40,000',
    algorithmStatus: 'OPTIMAL',
    proposedPoints: [
      {
        id: 'PROP-P01-01',
        nodeTier: 'Tier-1 (Surface Extensometer)',
        latitude: 23.770,
        longitude: 86.412,
        confidence: 0.89,
        priority: 'MEDIUM',
        purpose: 'Boundary settlement benchmark monument',
        estimatedCostINR: 35000
      }
    ]
  },
  'MINE-01:P-02': {
    mineId: 'MINE-01',
    panelId: 'P-02',
    panelName: 'East Extraction Panel 02',
    totalPlannedNodes: 45,
    installedNodes: 42,
    proposedNodesCount: 3,
    coveragePercent: 96.2,
    estimatedCostINR: '₹ 1,20,000',
    algorithmStatus: 'OPTIMAL',
    proposedPoints: []
  },
  'MINE-01:P-04': {
    mineId: 'MINE-01',
    panelId: 'P-04',
    panelName: 'West Barrier Panel 04',
    totalPlannedNodes: 40,
    installedNodes: 36,
    proposedNodesCount: 4,
    coveragePercent: 93.0,
    estimatedCostINR: '₹ 1,60,000',
    algorithmStatus: 'OPTIMAL',
    proposedPoints: []
  },
  'MINE-01:P-05': {
    mineId: 'MINE-01',
    panelId: 'P-05',
    panelName: 'Central Pillar Panel 05',
    totalPlannedNodes: 45,
    installedNodes: 40,
    proposedNodesCount: 5,
    coveragePercent: 92.5,
    estimatedCostINR: '₹ 2,00,000',
    algorithmStatus: 'ANALYSIS_COMPLETE',
    proposedPoints: []
  }
};

export const panelNodeRelocations: Record<string, NodeRelocationItem[]> = {
  'MINE-01:P-03': [
    {
      id: 'RELOC-001',
      nodeId: 'N127',
      mineId: 'MINE-01',
      panelId: 'P-03',
      currentZone: 'Goaf Outer Perimeter (Zone B)',
      recommendedZone: 'Critical Subsidence Trough Center (Zone D)',
      currentCoordinates: [23.746, 86.422],
      recommendedCoordinates: [23.748, 86.418],
      distanceMeters: 45,
      priority: 'HIGH',
      confidence: 0.93,
      reason: 'Longwall face advancement has shifted the maximum tensile strain zone 45m northwest.',
      extractionProgressionEffect: 'Face advanced 120m in past 30 days.'
    },
    {
      id: 'RELOC-002',
      nodeId: 'N134',
      mineId: 'MINE-01',
      panelId: 'P-03',
      currentZone: 'Stabilized Barrier (Zone A)',
      recommendedZone: 'Active Fracture Fringe (Zone C)',
      currentCoordinates: [23.754, 86.412],
      recommendedCoordinates: [23.751, 86.416],
      distanceMeters: 62,
      priority: 'MEDIUM',
      confidence: 0.87,
      reason: 'Re-align extensometer array perpendicular to secondary roof cleavage fractures.',
      extractionProgressionEffect: 'Barrier stress equilibrium reached.'
    }
  ]
};

export const complianceAuditRecords: ComplianceItem[] = [
  {
    id: 'COMP-DGMS-01',
    mineId: 'MINE-01',
    regulationCode: 'CMR 2017 Reg 106(2)(b)',
    title: 'Continuous Surface Strata Deformation Surveillance',
    authority: 'Directorate General of Mines Safety (DGMS)',
    status: 'COMPLIANT',
    lastAuditDate: '2026-05-15',
    nextDueDate: '2026-06-15',
    responsibleOfficer: 'Er. S. Sengupta (Agent & Manager)',
    description: 'Mandatory automated multi-point extensometer coverage over all active longwall and depillaring extraction panels.'
  },
  {
    id: 'COMP-DGMS-02',
    mineId: 'MINE-01',
    regulationCode: 'DGMS Tech. Circular No. 3 of 2020',
    title: 'Early Warning Audio-Visual Strata Alarm Thresholds',
    authority: 'DGMS Central Zone',
    status: 'ACTION_REQUIRED',
    lastAuditDate: '2026-05-18',
    nextDueDate: '2026-05-25',
    responsibleOfficer: 'Safety Officer (Shri A. K. Verma)',
    description: 'Statutory 50mm displacement threshold breach on Panel P-03 requires zonal inspectorate notification.',
    actionItem: 'Submit Form-IV strata subsidence report within 24 hours.'
  },
  {
    id: 'COMP-DGMS-03',
    mineId: 'MINE-01',
    regulationCode: 'Coal Mines Regulations 2017 Reg 111',
    title: 'Barrier Pillar Dimension Stability & Tilt Logs',
    authority: 'BCCL Safety Directorate',
    status: 'COMPLIANT',
    lastAuditDate: '2026-05-10',
    nextDueDate: '2026-06-10',
    responsibleOfficer: 'Surveyor in-charge',
    description: 'Routine monthly geodetic leveling logs and tiltmeter verification across barrier pillars.'
  }
];

export const centralHistoricalTrends: Record<string, TrendMetricPoint[]> = {
  '24h': [
    { time: '00:00', displacement: 14.2, tilt: 0.8, vibration: 0.15, crackWidth: 0.2, riskScore: 35, predictedRiskScore: 38, predictedConfidence: 89 },
    { time: '03:00', displacement: 16.5, tilt: 0.9, vibration: 0.18, crackWidth: 0.3, riskScore: 38, predictedRiskScore: 42, predictedConfidence: 88 },
    { time: '06:00', displacement: 21.0, tilt: 1.3, vibration: 0.32, crackWidth: 0.6, riskScore: 48, predictedRiskScore: 54, predictedConfidence: 87 },
    { time: '09:00', displacement: 28.4, tilt: 1.8, vibration: 0.45, crackWidth: 1.1, riskScore: 58, predictedRiskScore: 65, predictedConfidence: 85 },
    { time: '12:00', displacement: 38.6, tilt: 2.5, vibration: 0.72, crackWidth: 2.4, riskScore: 72, predictedRiskScore: 78, predictedConfidence: 84 },
    { time: '15:00', displacement: 49.2, tilt: 3.2, vibration: 1.10, crackWidth: 4.1, riskScore: 82, predictedRiskScore: 86, predictedConfidence: 83 },
    { time: '18:00', displacement: 62.8, tilt: 4.1, vibration: 1.65, crackWidth: 5.5, riskScore: 89, predictedRiskScore: 92, predictedConfidence: 82 },
    { time: '21:00', displacement: 74.6, tilt: 4.8, vibration: 1.95, crackWidth: 6.8, riskScore: 94, predictedRiskScore: 96, predictedConfidence: 81 }
  ],
  '7d': [
    { time: 'Day 1', displacement: 8.2, tilt: 0.4, vibration: 0.10, crackWidth: 0.1, riskScore: 22, predictedRiskScore: 24, predictedConfidence: 92 },
    { time: 'Day 2', displacement: 11.5, tilt: 0.6, vibration: 0.12, crackWidth: 0.1, riskScore: 28, predictedRiskScore: 30, predictedConfidence: 91 },
    { time: 'Day 3', displacement: 16.8, tilt: 0.9, vibration: 0.19, crackWidth: 0.4, riskScore: 36, predictedRiskScore: 40, predictedConfidence: 89 },
    { time: 'Day 4', displacement: 24.3, tilt: 1.4, vibration: 0.35, crackWidth: 0.9, riskScore: 50, predictedRiskScore: 55, predictedConfidence: 87 },
    { time: 'Day 5', displacement: 39.1, tilt: 2.3, vibration: 0.68, crackWidth: 2.1, riskScore: 68, predictedRiskScore: 74, predictedConfidence: 85 },
    { time: 'Day 6', displacement: 56.4, tilt: 3.6, vibration: 1.25, crackWidth: 4.8, riskScore: 84, predictedRiskScore: 88, predictedConfidence: 84 },
    { time: 'Day 7', displacement: 74.6, tilt: 4.8, vibration: 1.95, crackWidth: 6.8, riskScore: 94, predictedRiskScore: 95, predictedConfidence: 82 }
  ],
  '30d': [
    { time: 'Week 1', displacement: 4.5, tilt: 0.2, vibration: 0.08, crackWidth: 0.0, riskScore: 15, predictedRiskScore: 18, predictedConfidence: 94 },
    { time: 'Week 2', displacement: 12.0, tilt: 0.6, vibration: 0.14, crackWidth: 0.2, riskScore: 29, predictedRiskScore: 32, predictedConfidence: 91 },
    { time: 'Week 3', displacement: 31.5, tilt: 1.9, vibration: 0.52, crackWidth: 1.6, riskScore: 62, predictedRiskScore: 67, predictedConfidence: 86 },
    { time: 'Week 4', displacement: 74.6, tilt: 4.8, vibration: 1.95, crackWidth: 6.8, riskScore: 94, predictedRiskScore: 96, predictedConfidence: 82 }
  ]
};

export const centralPredictedRisk: PredictedRiskData = {
  currentRisk: 'CRITICAL',
  currentScore: 92,
  predictedRisk: 'HIGH',
  confidencePercent: 88.5,
  trendDirection: 'INCREASING',
  forecastWindowHours: 48,
  recommendedActions: [
    'Enforce 150-meter safety standoff buffer around Panel P-03 goaf perimeter.',
    'Deploy secondary automated borehole tiltmeter array along North-South geological fault line.',
    'Alert DGMS (Directorate General of Mines Safety) zonal inspectorate as per statutory regulation 106(2)(b).'
  ]
};

export const centralReportsList: ReportItem[] = [
  {
    id: 'REP-2026-05-01',
    title: 'DGMS Statutory Mine Subsidence & Strata Risk Assessment',
    category: 'Mine Risk Summary',
    generatedAt: '2026-05-21 09:30:00',
    generatedBy: 'Mine Planning Division (Er. S. Sengupta)',
    period: 'Last 30 Days (May 2026)',
    summaryText: 'Comprehensive mine-wide subsidence audit covering Panels P-01 through P-05. Identified accelerated strain release in South Panel P-03 goaf zone requiring immediate regulatory inspection.',
    metricsSummary: {
      totalMonitoredPanels: 5,
      activeGateways: 8,
      deployedNodes: 240,
      maxObservedDeformationMm: 74.6,
      criticalPanels: 1,
      complianceStatus: 'ACTION_REQUIRED'
    },
    format: 'PDF',
    mineId: 'MINE-01'
  },
  {
    id: 'REP-2026-05-02',
    title: 'Panel P-03 Subsidence Trough & Influence Profile',
    category: 'Panel Risk Summary',
    generatedAt: '2026-05-21 08:00:00',
    generatedBy: 'Geotechnical Engineering Bureau',
    period: 'Last 7 Days',
    summaryText: 'Spatial IDW deformation interpolation analysis of Panel P-03 showing asymmetric subsidence trough progression towards GW-05 sector.',
    metricsSummary: {
      panelId: 'P-03',
      depthMeters: 220,
      extractionRatio: '72%',
      maxInclineAngleDeg: 4.8,
      riskLevel: 'CRITICAL'
    },
    format: 'PDF',
    mineId: 'MINE-01',
    panelId: 'P-03'
  },
  {
    id: 'REP-2026-05-03',
    title: 'MineGuard LoRa Mesh Backhaul & Gateway Telemetry Health',
    category: 'Gateway Health',
    generatedAt: '2026-05-21 06:00:00',
    generatedBy: 'Central Network Operations',
    period: 'Last 24 Hours',
    summaryText: 'Audit of all 8 LoRa mesh gateway nodes across underground levels. 7 of 8 gateways operating in excellent/good sync; GW-06 scheduled for backhaul antenna check.',
    metricsSummary: {
      onlineRate: '98.8%',
      avgLatencyMs: 142,
      syncedGateways: '7/8',
      meshPacketDeliveryRatio: '99.4%'
    },
    format: 'CSV',
    mineId: 'MINE-01'
  }
];
