export const getSensorColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'normal':
    case 'low':
      return '#22c55e'; // green
    case 'warning':
    case 'moderate':
      return '#eab308'; // yellow
    case 'high':
      return '#f97316'; // orange
    case 'critical':
      return '#ef4444'; // red
    case 'offline':
      return '#94a3b8'; // gray
    default:
      return '#22c55e';
  }
};

export const getSeverityColorClass = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'normal':
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'offline':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

// Prototype thresholds
export const getTiltSeverity = (tilt: number) => {
  if (tilt >= 5) return 'High';
  if (tilt >= 2) return 'Elevated';
  return 'Normal';
};

export const getDisplacementSeverity = (disp: number) => {
  if (disp >= 50) return 'High';
  if (disp >= 20) return 'Elevated';
  return 'Normal';
};

export const getVibrationSeverity = (vib: number) => {
  if (vib >= 1) return 'High';
  if (vib >= 0.5) return 'Elevated';
  return 'Normal';
};

export const getBatterySeverity = (battery: number) => {
  if (battery <= 15) return 'Critical';
  if (battery <= 30) return 'Low';
  return 'Good';
};
