import { MinePanelFeature } from '../types/gis';

export const mockMinePanel: MinePanelFeature = {
  type: 'Feature',
  properties: {
    panelId: 'PANEL-A',
    depthM: 250,
    status: 'ACTIVE'
  },
  geometry: {
    type: 'Polygon',
    // Realistic coordinates in India (e.g., Jharia region approximately)
    coordinates: [[
      [86.410, 23.750],
      [86.425, 23.752],
      [86.422, 23.765],
      [86.408, 23.762],
      [86.410, 23.750] // close polygon
    ]]
  }
};
