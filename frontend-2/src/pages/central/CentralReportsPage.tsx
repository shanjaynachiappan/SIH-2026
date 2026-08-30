import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Clock, 
  User, 
  FileSpreadsheet,
  Building2,
  Grid
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { ReportItem, MineInfo, MinePanel } from '../../types/central';

export const CentralReportsPage: React.FC = () => {
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState('ALL');
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState('ALL');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadMines = async () => {
      const mList = await centralApiService.getMines();
      setMines(mList);
    };
    loadMines();
  }, []);

  useEffect(() => {
    const loadPanels = async () => {
      const pList = await centralApiService.getPanels(selectedMineId === 'ALL' ? undefined : selectedMineId);
      setPanels(pList);
      setSelectedPanelId('ALL');
    };
    loadPanels();
  }, [selectedMineId]);

  useEffect(() => {
    const load = async () => {
      const list = await centralApiService.getReports(
        selectedMineId === 'ALL' ? undefined : selectedMineId,
        selectedPanelId === 'ALL' ? undefined : selectedPanelId
      );
      setReports(list);
    };
    load();
  }, [selectedMineId, selectedPanelId]);

  const filteredReports = reports.filter(r => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.summaryText.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExport = (report: ReportItem, format: 'PDF' | 'CSV') => {
    centralApiService.exportReport(report.id, format);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-slate-900">Mine-Wide Regulatory & Operational Reports</h1>
          </div>
          <p className="text-sm text-slate-500">DGMS statutory subsidence reports, geotechnical audits, and sensor health archives</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Mine Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Mines</option>
              {mines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Panel Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Grid className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Panels</option>
              {panels.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Mine Risk Summary">Mine Risk Summary</option>
            <option value="Panel Risk Summary">Panel Risk Summary</option>
            <option value="Gateway Health">Gateway Health</option>
            <option value="Historical Deformation">Historical Deformation</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <span className="font-mono text-slate-500 font-bold">
          {filteredReports.length} Reports Found
        </span>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map(report => (
          <div 
            key={report.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex items-start space-x-4 flex-1">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200">
                    {report.id}
                  </span>
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
                    {report.category}
                  </span>
                  {report.mineId && (
                    <span className="text-xs font-mono font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {report.mineId} {report.panelId ? `→ ${report.panelId}` : ''}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">Period: {report.period}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 pt-1">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {report.summaryText}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {report.generatedBy}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {report.generatedAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <button
                onClick={() => handleExport(report, 'PDF')}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => handleExport(report, 'CSV')}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
