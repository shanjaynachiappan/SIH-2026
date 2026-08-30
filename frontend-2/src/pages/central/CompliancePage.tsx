import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, ComplianceItem } from '../../types/central';

export const CompliancePage: React.FC = () => {
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('ALL');
  const [records, setRecords] = useState<ComplianceItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const [mList, cList] = await Promise.all([
        centralApiService.getMines(),
        centralApiService.getComplianceRecords(selectedMineId === 'ALL' ? undefined : selectedMineId)
      ]);
      setMines(mList);
      setRecords(cList);
    };
    load();
  }, [selectedMineId]);

  const filteredRecords = records.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.regulationCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded">
              DGMS Governance & Compliance
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Statutory Safety Clearance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Directorate General of Mines Safety (DGMS) Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance audit logs, threshold notifications, and Coal Mines Regulations (CMR 2017) records.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
          <Building2 className="w-3.5 h-3.5 text-slate-500 ml-1" />
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Compliant Standards</div>
            <div className="text-2xl font-black text-emerald-600">2 / 3</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Action Required</div>
            <div className="text-2xl font-black text-amber-600">1 Item</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Next Audit Due</div>
            <div className="text-lg font-black text-slate-800">25 May 2026</div>
          </div>
        </div>
      </div>

      {/* Compliance Records List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Statutory Regulation Registry ({records.length})
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory mining surveillance conditions under DGMS Central & Eastern Zonal directives.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search regulation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredRecords.map(rec => {
            const isActionReq = rec.status === 'ACTION_REQUIRED';

            return (
              <div
                key={rec.id}
                className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded">
                      {rec.regulationCode}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{rec.title}</h4>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    isActionReq ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {rec.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{rec.description}</p>

                {rec.actionItem && (
                  <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-800">
                    <span className="font-bold uppercase text-[10px]">Action Item:</span> {rec.actionItem}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div>Authority: <strong className="text-slate-700">{rec.authority}</strong></div>
                  <div>Responsible: <strong className="text-slate-700">{rec.responsibleOfficer}</strong></div>
                  <div>Last Audit: <strong className="text-slate-700">{rec.lastAuditDate}</strong></div>
                  <div>Next Due: <strong className="text-slate-700">{rec.nextDueDate}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
