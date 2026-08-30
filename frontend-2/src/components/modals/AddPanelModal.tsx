import React, { useState } from 'react';
import { X, Grid, Building2, Plus, AlertCircle } from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel } from '../../types/central';

interface AddPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  mines: MineInfo[];
  defaultMineId?: string;
  onPanelCreated: (newPanel: MinePanel) => void;
}

export const AddPanelModal: React.FC<AddPanelModalProps> = ({
  isOpen,
  onClose,
  mines,
  defaultMineId = 'MINE-01',
  onPanelCreated
}) => {
  const [mineId, setMineId] = useState(defaultMineId);
  const [panelId, setPanelId] = useState('');
  const [panelName, setPanelName] = useState('');
  const [status, setStatus] = useState<MinePanel['status']>('NEW');
  const [depthMeters, setDepthMeters] = useState(250);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!panelId.trim()) {
      setError('Panel ID is required (e.g. P-05)');
      return;
    }
    if (!panelName.trim()) {
      setError('Panel Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await centralApiService.addPanel({
        id: panelId.trim().toUpperCase(),
        name: panelName.trim(),
        mineId,
        depthMeters: Number(depthMeters),
        status,
        description: description.trim() || 'Newly created mine panel'
      });

      onPanelCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create panel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">ADD NEW PANEL</h3>
              <p className="text-xs text-slate-500 font-medium">Create a new underground extraction panel under target mine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Mine */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Mine</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {mines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Panel ID */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Panel ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. P-05"
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 font-medium">Must be unique per mine</span>
            </div>

            {/* Depth */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mining Depth (Meters)</label>
              <input
                type="number"
                value={depthMeters}
                onChange={(e) => setDepthMeters(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Panel Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Panel Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. North Subsidence Panel 05"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Panel Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MinePanel['status'])}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NEW">New (Planning Stage)</option>
              <option value="ACTIVE">Active (Under Extraction)</option>
              <option value="STANDBY">Standby</option>
              <option value="HIGH_ATTENTION">High Attention</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Panel Description & Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Sub-surface continuous miner longwall panel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Panel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
