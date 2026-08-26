import React from 'react';
import { CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { MonitoringNode } from '../../types';
import { getSensorColor } from '../../utils/sensorHelpers';
import { NodeTooltip } from './NodeTooltip';
import { NodePopup } from './NodePopup';

interface NodeMarkersProps {
  nodes: MonitoringNode[];
}

export const NodeMarkers: React.FC<NodeMarkersProps> = ({ nodes }) => {
  return (
    <>
      {nodes.map((node) => (
        <CircleMarker
          key={node.id}
          center={[node.latitude, node.longitude]}
          radius={6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: getSensorColor(node.status),
            fillOpacity: 1,
            className: 'transition-all duration-300'
          }}
          eventHandlers={{
            mouseover: (e) => {
              const layer = e.target;
              layer.setRadius(8);
              layer.setStyle({ weight: 3, fillOpacity: 0.9 });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setRadius(6);
              layer.setStyle({ weight: 2, fillOpacity: 1 });
            }
          }}
        >
          <Tooltip className="custom-tooltip bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg p-3" sticky>
            <NodeTooltip node={node} />
          </Tooltip>
          <Popup className="sensor-popup min-w-[300px]" closeButton={false}>
            <NodePopup node={node} />
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};
