import React, { useState, useEffect } from 'react';
import { X, MapPin, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { MinePanel } from '../../types/central';
import { centralApiService } from '../../services/centralApiService';

interface ConfigureCoordinatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  panel: MinePanel;
  onGeometrySaved: (updatedPanel: MinePanel) => void;
}

export const ConfigureCoordinatesModal: React.FC<ConfigureCoordinatesModalProps> = ({
  isOpen,
  onClose,
  panel,
  onGeometrySaved
}) => {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (panel && panel.geometry && panel.geometry.coordinates) {
      setCoords([...panel.geometry.coordinates]);
    }
  }, [panel]);

  if (!isOpen || !panel) return null;

  const handleCoordChange = (index: number, latOrLng: 0 | 1, value: number) => {
    const next = [...coords];
    next[index] = [...next[index]] as [number, number];
    next[index][latOrLng] = value;
    setCoords(next);
  };

  const handleAddVertex = () => {
    const last = coords[coords.length - 1] || [23.758, 86.415];
    setCoords([...coords, [last[0] + 0.001, last[1] + 0.001]]);
  };

  const handleRemoveVertex = (index: number) => {
    if (coords.length <= 3) {
      alert('A polygon boundary requires at least 3 vertices.');
      return;
    }
    setCoords(coords.filter((_, i) => i !== index));
  };

  const handleResetPreset = (type: 'BOX' | 'DIAGONAL') => {
    const baseLat = panel.geometry.coordinates[0]?.[0] || 23.758;
    const baseLng = panel.geometry.coordinates[0]?.[1] || 86.415;

    if (type === 'BOX') {
      setCoords([
        [baseLat, baseLng],
        [baseLat + 0.004, baseLng],
        [baseLat + 0.004, baseLng + 0.004],
        [baseLat, baseLng + 0.004]
      ]);
    } else {
      setCoords([
        [baseLat, baseLng],
        [baseLat + 0.005, baseLng + 0.002],
        [baseLat + 0.003, baseLng + 0.006],
        [baseLat - 0.001, baseLng + 0.003]
      ]);
    }
  };

  const handleSave = async () => {
    if (coords.length < 3) {
      alert('Boundary polygon must have at least 3 coordinate points.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await centralApiService.updatePanelGeometry(panel.mineId, panel.id, coords);
      if (updated) {
        setSuccessMsg(`Boundary geometry saved for panel ${panel.id}!`);
        onGeometrySaved(updated);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 800);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save geometry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                CONFIGURE BOUNDARY COORDINATES: {panel.id}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {panel.name} • Mine: {panel.mineId}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Preset Actions */}
        <div className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl gap-2 text-xs">
          <span className="font-bold text-slate-700">Quick Presets & Actions:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleResetPreset('BOX')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg"
            >
              Box Polygon
            </button>
            <button
              onClick={() => handleResetPreset('DIAGONAL')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg"
            >
              Longwall Seam Polygon
            </button>
            <button
              onClick={handleAddVertex}
              className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vertex</span>
            </button>
          </div>
        </div>

        {/* Vertices List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Polygon Boundary Vertices ({coords.length} Points)
          </div>

          {coords.map((pt, idx) => (
            <div 
              key={idx} 
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between space-x-3 text-xs"
            >
              <span className="font-mono font-bold text-indigo-700 w-20">
                Vertex #{idx + 1}
              </span>

              <div className="flex items-center space-x-2 flex-1">
                <span className="text-slate-400 font-semibold">Lat:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={pt[0]}
                  onChange={(e) => handleCoordChange(idx, 0, parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-mono font-bold"
                />

                <span className="text-slate-400 font-semibold">Lng:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={pt[1]}
                  onChange={(e) => handleCoordChange(idx, 1, parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-mono font-bold"
                />
              </div>

              <button
                onClick={() => handleRemoveVertex(idx)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove vertex"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Changes only affect panel <strong>{panel.id}</strong> geometry.
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Boundary Geometry'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
