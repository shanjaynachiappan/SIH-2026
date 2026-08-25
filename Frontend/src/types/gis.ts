import { Polygon } from 'geojson';

export interface MinePanel {
  panelId: string;
  depthM: number;
  status: string;
}

export interface MinePanelFeature {
  type: 'Feature';
  properties: MinePanel;
  geometry: Polygon;
}

export interface Point {
  latitude: number;
  longitude: number;
}
