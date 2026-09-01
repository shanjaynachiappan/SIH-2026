import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, CheckCircle2 } from 'lucide-react';
import { MinePanel } from '../../types/central';
import { centralApiService } from '../../services/centralApiService';
import { calculatePolygonCenter, convertCenterAndDimensionsToPolygon } from '../../services/placementService';

interface EditPanelGeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  panel: MinePanel;
  onGeometryApplied: (updatedPanel: MinePanel) => void;
}

export const EditPanelGeometryModal: React.FC<EditPanelGeometryModalProps> = ({
  isOpen,
  onClose,
  panel,
  onGeometryApplied
}) => {
  const [centerLat, setCenterLat] = useState(23.758);
  const [centerLng, setCenterLng] = useState(86.415);
  const [widthM, setWidthM] = useState(500);
  const [heightM, setHeightM] = useState(800);
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (panel && panel.geometry && panel.geometry.coordinates) {
      const calc = calculatePolygonCenter(panel.geometry.coordinates);
      setCenterLat(parseFloat(calc.centerLat.toFixed(5)));
      setCenterLng(parseFloat(calc.centerLng.toFixed(5)));
      setWidthM(calc.widthM);
      setHeightM(calc.heightM);
    }
  }, [panel]);

  if (!isOpen || !panel) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);

    try {
      const updatedPolygon = convertCenterAndDimensionsToPolygon(centerLat, centerLng, widthM, heightM);
      const updated = await centralApiService.updatePanelGeometry(panel.mineId, panel.id, updatedPolygon);

      if (updated) {
        setSuccessMsg(`Panel geometry updated for ${panel.id}!`);
        onGeometryApplied(updated);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 600);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update geometry');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">EDIT PANEL GEOMETRY</h3>
              <p className="text-xs text-slate-500 font-medium">Numeric coordinate & dimension scaling for {panel.id}</p>
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

        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Panel</label>
            <input
              type="text"
              disabled
              value={`${panel.id} - ${panel.name} (${panel.mineId})`}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Center Latitude */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={centerLat}
                onChange={(e) => setCenterLat(parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Center Longitude */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={centerLng}
                onChange={(e) => setCenterLng(parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Width */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Panel Width (Meters)</label>
              <input
                type="number"
                step="10"
                value={widthM}
                onChange={(e) => setWidthM(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Panel Height / Length (Meters)</label>
              <input
                type="number"
                step="10"
                value={heightM}
                onChange={(e) => setHeightM(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            Applying coordinates converts dimensions to an exact geographic polygon centered on <strong>({centerLat}, {centerLng})</strong>. The GIS map will redraw live!
          </div>

          {/* Sanity-check warning: the CMRI subsidence model's evaluation grid
              and validated W/H range degrade for unrealistically large/extreme
              panels -- e.g. a 1.5km-wide panel was found to produce ZERO
              Full/Crack tier nodes (everything defaulted to Lite) because the
              trough profile stays too flat across a normal grid extent, and
              W/H falls outside the model's validated 0.5-3 range. This won't
              block saving, but flags it before it silently degrades the
              placement algorithm's output. */}
          {(widthM > 600 || heightM > 600 || widthM / heightM > 3 || heightM / widthM > 3) && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-800 flex items-start space-x-2">
              <span className="font-bold">⚠ Unrealistic panel size:</span>
              <span>
                Real coal panels are typically 100–300m wide. This panel
                ({widthM}m × {heightM}m, W/H ratio {(widthM / heightM).toFixed(2)})
                is outside the CMRI subsidence model's validated W/H range (0.5–3)
                {(widthM > 600 || heightM > 600) && ' and larger than the model can reliably evaluate'}.
                Sensor placement may default to Lite-tier-only coverage (no Full/Crack
                nodes) since the algorithm can't resolve real risk variation across a
                panel this size. Consider splitting this into smaller sub-panels, or
                proceed and treat the result as low-confidence.
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isApplying}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isApplying ? 'Applying...' : 'Apply Coordinates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};