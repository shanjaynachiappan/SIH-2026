import React, { useState, useEffect, useMemo } from 'react';
import { Target, Filter, Search, Hexagon, RefreshCw, Play, MapPin, AlertTriangle, Download, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 } from 'lucide-react';
import { fetchNodePlacement, runNodePlacement } from '../services/apiService';
import { NodePlacementMap } from '../components/gis/NodePlacementMap';
import * as turf from '@turf/turf';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const DEFAULT_COORDS = {
  northWest: { latitude: 23.76485, longitude: 86.42966 },
  northEast: { latitude: 23.76485, longitude: 86.43113 },
  southEast: { latitude: 23.76395, longitude: 86.43113 },
  southWest: { latitude: 23.76395, longitude: 86.42966 }
};

export const NodePlacementPage: React.FC = () => {
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  
  const [layerControls, setLayerControls] = useState({
    panelBoundary: true,
    influenceZone: true,
    riskZones: true,
    fullSensors: true,
    crackSensors: true,
    liteSensors: true,
  });
  
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [previousStats, setPreviousStats] = useState<any>(null);

  // Form State
  const [coords, setCoords] = useState<Record<string, { latitude: number | '', longitude: number | '' }>>(DEFAULT_COORDS);
  const [coordsChanged, setCoordsChanged] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const data = await fetchNodePlacement();
      if (isMounted && data) {
        setGeojsonData(data);
        if (data.panel_geometry && data.panel_geometry.coordinates && data.panel_geometry.coordinates[0]) {
          const coordsArr = data.panel_geometry.coordinates[0];
          setCoords({
            northWest: { longitude: coordsArr[0][0], latitude: coordsArr[0][1] },
            northEast: { longitude: coordsArr[1][0], latitude: coordsArr[1][1] },
            southEast: { longitude: coordsArr[2][0], latitude: coordsArr[2][1] },
            southWest: { longitude: coordsArr[3][0], latitude: coordsArr[3][1] }
          });
        }
      }
      if (isMounted) setLoading(false);
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleCoordChange = (corner: keyof typeof coords, field: 'latitude' | 'longitude', value: string) => {
    setCoords(prev => ({
      ...prev,
      [corner]: {
        ...prev[corner],
        [field]: value === '' ? '' : Number(value)
      }
    }));
    setCoordsChanged(true);
  };

  const validateCoords = () => {
    for (const corner of Object.values(coords)) {
      if (corner.latitude === '' || corner.longitude === '') return false;
      const lat = Number(corner.latitude);
      const lon = Number(corner.longitude);
      if (isNaN(lat) || isNaN(lon)) return false;
      if (lat < -90 || lat > 90) return false;
      if (lon < -180 || lon > 180) return false;
    }
    return true;
  };

  const handleReset = () => {
    setCoords(DEFAULT_COORDS);
    setCoordsChanged(false);
    setRunError(null);
  };

  const stats = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return { total: 0, full: 0, lite: 0, crack: 0, high: 0, medium: 0, low: 0 };
    
    let total = 0, full = 0, lite = 0, crack = 0, high = 0, medium = 0, low = 0;
    geojsonData.features.forEach((f: any) => {
      if (f.geometry.type === 'Point') {
        total++;
        if (f.properties.node_tier === 'Full') full++;
        else if (f.properties.node_tier === 'Lite') lite++;
        else if (f.properties.node_tier === 'Crack') crack++;
        
        const risk = f.properties.risk_level?.toLowerCase();
        if (risk === 'high') high++;
        else if (risk === 'medium') medium++;
        else if (risk === 'low') low++;
      }
    });
    
    return { total, full, lite, crack, high, medium, low };
  }, [geojsonData]);

  const handleRunAnalysis = async () => {
    if (!validateCoords()) return;
    setRunningAnalysis(true);
    setRunError(null);
    
    if (geojsonData && geojsonData.panel_geometry && !coordsChanged) {
      // Don't save previous stats if we are just re-running without changes
    } else if (geojsonData && geojsonData.panel_geometry) {
      setPreviousStats({
        width_m: geojsonData.panel_geometry.width_m,
        length_m: geojsonData.panel_geometry.length_m,
        candidates: geojsonData.candidate_count,
        totalNodes: stats.total
      });
    }

    setGeojsonData(null); // Clear old results
    setSelectedNode(null);
    try {
      const result = await runNodePlacement(coords);
      setGeojsonData(result);
      setCoordsChanged(false);
    } catch (e: any) {
      setRunError(e.message || "Placement analysis failed. Please try again.");
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleExport = () => {
    if (!geojsonData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojsonData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "node_placement_result.geojson");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const previewPanelCoords = useMemo(() => {
    if (!validateCoords()) return null;
    return [
      [Number(coords.northWest.latitude), Number(coords.northWest.longitude)] as [number, number],
      [Number(coords.northEast.latitude), Number(coords.northEast.longitude)] as [number, number],
      [Number(coords.southEast.latitude), Number(coords.southEast.longitude)] as [number, number],
      [Number(coords.southWest.latitude), Number(coords.southWest.longitude)] as [number, number]
    ];
  }, [coords]);

  const tierChartData = [
    { name: 'Full', value: stats.full, color: '#3b82f6' },
    { name: 'Lite', value: stats.lite, color: '#10b981' },
    { name: 'Crack', value: stats.crack, color: '#f59e0b' },
  ];

  const riskChartData = [
    { name: 'High', value: stats.high, color: '#ef4444' },
    { name: 'Medium', value: stats.medium, color: '#f59e0b' },
    { name: 'Low', value: stats.low, color: '#10b981' },
  ];

  const validationStats = useMemo(() => {
    if (!geojsonData || !geojsonData.features || !previewPanelCoords) return { invalidCount: 0, outsideCrackCount: 0 };
    
    let turfPanelPolygon: any;
    if (geojsonData.panel_geometry?.coordinates) {
      turfPanelPolygon = turf.polygon(geojsonData.panel_geometry.coordinates);
    } else {
      const coordsArray = previewPanelCoords;
      turfPanelPolygon = turf.polygon([coordsArray.map(c => [c[1], c[0]])]);
    }
    
    let influenceZonePoly: any = null;
    if (geojsonData.influence_zone) {
      if (geojsonData.influence_zone.type === "FeatureCollection" && geojsonData.influence_zone.features.length > 0) {
        influenceZonePoly = geojsonData.influence_zone.features[0];
      } else if (geojsonData.influence_zone.type === "Feature") {
        influenceZonePoly = geojsonData.influence_zone;
      }
    }
    
    let invalidCount = 0;
    let outsideCrackCount = 0;

    geojsonData.features.forEach((f: any) => {
      if (f.geometry.type === 'Point') {
        const tier = f.properties.node_tier;
        const inPanel = turf.booleanPointInPolygon(f, turfPanelPolygon);
        const inInfluenceZone = influenceZonePoly ? turf.booleanPointInPolygon(f, influenceZonePoly) : false;
        
        if (tier === 'Full' || tier === 'Lite') {
          if (!inPanel) {
            invalidCount++;
            console.warn(`Validation Failed: ${tier} Node ${f.properties.id || 'Unknown'} is outside the panel boundary!`);
          }
        } else if (tier === 'Crack') {
          if (!inPanel) {
            if (inInfluenceZone) {
              outsideCrackCount++;
            } else {
              invalidCount++;
              console.warn(`Validation Failed: Crack Node ${f.properties.id || 'Unknown'} is outside both the panel and the influence zone!`);
            }
          }
        } else {
            invalidCount++;
        }
      }
    });
    
    return { invalidCount, outsideCrackCount };
  }, [geojsonData, previewPanelCoords]);

  const renderCoordInput = (label: string, corner: keyof typeof coords) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="flex space-x-2">
        <input 
          type="number" 
          step="0.00001"
          placeholder="Lat"
          className={`w-24 text-xs border rounded px-2 py-1 ${coords[corner].latitude === '' || Number(coords[corner].latitude) < -90 || Number(coords[corner].latitude) > 90 ? 'border-red-500' : 'border-slate-200'} focus:ring-cyan-500 focus:border-cyan-500`}
          value={coords[corner].latitude}
          onChange={(e) => handleCoordChange(corner, 'latitude', e.target.value)}
        />
        <input 
          type="number" 
          step="0.00001"
          placeholder="Lon"
          className={`w-24 text-xs border rounded px-2 py-1 ${coords[corner].longitude === '' || Number(coords[corner].longitude) < -180 || Number(coords[corner].longitude) > 180 ? 'border-red-500' : 'border-slate-200'} focus:ring-cyan-500 focus:border-cyan-500`}
          value={coords[corner].longitude}
          onChange={(e) => handleCoordChange(corner, 'longitude', e.target.value)}
        />
      </div>
    </div>
  );

  const getExplanation = (node: any) => {
    const reasons = [];
    const p = node.properties;
    
    if (p.risk_level === 'High') reasons.push("High-risk location due to elevated subsidence or strain");
    else if (p.risk_level === 'Medium') reasons.push("Medium-risk location requiring secondary monitoring");
    
    if (p.subsidence_mm > 50) reasons.push(`Elevated subsidence detected (${p.subsidence_mm.toFixed(1)} mm)`);
    
    if (p.strain_ue > 150) {
      reasons.push(`Elevated tensile strain (${p.strain_ue.toFixed(1)} μe) indicating surface cracking potential`);
    } else if (p.strain_ue < -150) {
      reasons.push(`High compressive strain (${p.strain_ue.toFixed(1)} μe) near subsidence trough`);
    }
    
    reasons.push(`Required sensor tier: ${p.node_tier}`);
    return reasons;
  };

  const getDiffNode = (current: number, prev: number) => {
    const diff = current - prev;
    if (diff === 0) return <span className="text-slate-400 text-xs ml-2">No change</span>;
    if (diff > 0) return <span className="text-emerald-500 text-xs ml-2 flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5"/> {diff}</span>;
    return <span className="text-red-500 text-xs ml-2 flex items-center"><ArrowDownRight className="w-3 h-3 mr-0.5"/> {Math.abs(diff)}</span>;
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 relative p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Target className="w-6 h-6 mr-2 text-cyan-600" />
            Node Placement
          </h1>
          <p className="text-slate-500 mt-1">AI-driven sensor placement recommendations for optimal mine monitoring</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={!geojsonData || coordsChanged}
          className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Panel Configuration */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                Mine Area Configuration
              </h3>
              {coordsChanged && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  Coordinates changed — run analysis to update recommendations.
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-end gap-6">
              {renderCoordInput('North-West', 'northWest')}
              {renderCoordInput('North-East', 'northEast')}
              {renderCoordInput('South-East', 'southEast')}
              {renderCoordInput('South-West', 'southWest')}
              
              <div className="flex space-x-3 ml-auto">
                <button 
                  onClick={handleReset}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </button>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={runningAnalysis || !validateCoords()}
                  className="flex items-center px-4 py-1.5 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {runningAnalysis ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  {runningAnalysis ? 'Running Analysis...' : 'Run Placement Analysis'}
                </button>
              </div>
            </div>
            
            {runError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {runError}
              </div>
            )}

            {validationStats.invalidCount > 0 && !coordsChanged && (
              <div className="mt-4 flex items-center p-3 text-red-700 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Backend placement validation failed</h4>
                  <p className="text-xs mt-0.5">One or more sensors ({validationStats.invalidCount}) were placed outside the supplied panel polygon or influence zone.</p>
                </div>
              </div>
            )}

            {validationStats.invalidCount === 0 && validationStats.outsideCrackCount > 0 && !coordsChanged && (
              <div className="mt-4 flex items-center p-3 text-cyan-700 bg-cyan-50 rounded-lg border border-cyan-200">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-cyan-600" />
                <div>
                  <h4 className="font-semibold text-sm">Crack Node Placement</h4>
                  <p className="text-xs mt-0.5">Crack sensors ({validationStats.outsideCrackCount}) are placed in the Angle-of-Draw influence zone outside the mine panel to monitor tensile cracking.</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Analysis Summary */}
          {!runError && geojsonData?.panel_geometry && !coordsChanged && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-8 items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Panel Area</p>
                <p className="font-bold text-slate-800 text-lg mt-1">
                  {(geojsonData.panel_geometry.width_m * geojsonData.panel_geometry.length_m).toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-normal text-slate-500">m²</span>
                </p>
                <p className="text-xs text-slate-400">{geojsonData.panel_geometry.width_m.toFixed(1)}m × {geojsonData.panel_geometry.length_m.toFixed(1)}m</p>
              </div>
              <div className="border-l border-slate-200 h-10"></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Candidates Evaluated</p>
                <div className="flex items-center mt-1">
                  <p className="font-bold text-slate-800 text-lg">{geojsonData.candidate_count}</p>
                  {previousStats && getDiffNode(geojsonData.candidate_count, previousStats.candidates)}
                </div>
              </div>
              <div className="border-l border-slate-200 h-10"></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Sensor Density</p>
                <p className="font-bold text-slate-800 text-lg mt-1">
                  {((stats.total / (geojsonData.panel_geometry.width_m * geojsonData.panel_geometry.length_m)) * 10000).toFixed(1)} <span className="text-sm font-normal text-slate-500">/ hectare</span>
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards (Interactive Toggles) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Recommended Sensors</p>
              <div className="flex items-center mt-1">
                <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                {previousStats && !coordsChanged && getDiffNode(stats.total, previousStats.totalNodes)}
              </div>
            </div>
            
            <div 
              onClick={() => setLayerControls(prev => ({...prev, fullSensors: !prev.fullSensors}))}
              className={`rounded-xl p-4 border shadow-sm cursor-pointer transition-all border-l-4 border-l-blue-500 select-none ${layerControls.fullSensors ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-500 uppercase">Full Nodes</p>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${layerControls.fullSensors ? 'bg-blue-500 border-blue-600 text-white' : 'border-slate-300'}`}>
                  {layerControls.fullSensors && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.full}</h3>
            </div>
            
            <div 
              onClick={() => setLayerControls(prev => ({...prev, liteSensors: !prev.liteSensors}))}
              className={`rounded-xl p-4 border shadow-sm cursor-pointer transition-all border-l-4 border-l-emerald-500 select-none ${layerControls.liteSensors ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-500 uppercase">Lite Nodes</p>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${layerControls.liteSensors ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {layerControls.liteSensors && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.lite}</h3>
            </div>
            
            <div 
              onClick={() => setLayerControls(prev => ({...prev, crackSensors: !prev.crackSensors}))}
              className={`rounded-xl p-4 border shadow-sm cursor-pointer transition-all border-l-4 border-l-amber-500 select-none ${layerControls.crackSensors ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-500' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-500 uppercase">Crack Nodes</p>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${layerControls.crackSensors ? 'bg-amber-500 border-amber-600 text-white' : 'border-slate-300'}`}>
                  {layerControls.crackSensors && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.crack}</h3>
            </div>
          </div>

          {/* Map and Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Map Layers:</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={layerControls.panelBoundary} 
                    onChange={() => setLayerControls(p => ({...p, panelBoundary: !p.panelBoundary}))}
                    className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Panel Boundary</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={layerControls.influenceZone} 
                    onChange={() => setLayerControls(p => ({...p, influenceZone: !p.influenceZone}))}
                    className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Influence Zone</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={layerControls.riskZones} 
                    onChange={() => setLayerControls(p => ({...p, riskZones: !p.riskZones}))}
                    className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Risk Zones</span>
                </label>
                <div className="border-l border-slate-300 h-4 mx-2"></div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    className="text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                  >
                    <option value="All">All Risks</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search Node ID..." 
                  className="pl-9 text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 p-2 relative">
              {runningAnalysis && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Running Analysis Pipeline...</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2 animate-pulse">1</div>
                      <span className="text-xs font-semibold text-slate-600">Geometry</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2 animate-pulse" style={{animationDelay: '0.2s'}}>2</div>
                      <span className="text-xs font-semibold text-slate-600">NCB / PFM</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2 animate-pulse" style={{animationDelay: '0.4s'}}>3</div>
                      <span className="text-xs font-semibold text-slate-600">Risk Fusion</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2 animate-pulse" style={{animationDelay: '0.6s'}}>4</div>
                      <span className="text-xs font-semibold text-slate-600">Placement</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!runningAnalysis && !geojsonData && !coordsChanged && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md">
                    <Target className="w-16 h-16 text-cyan-600 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Define your mine panel</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      Sensor recommendations will be intelligently generated based on the supplied geographic panel coordinates and physical subsidence modeling.
                    </p>
                    <button 
                      onClick={handleRunAnalysis}
                      disabled={!validateCoords()}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors shadow-md w-full disabled:opacity-50"
                    >
                      Run Placement Analysis
                    </button>
                  </div>
                </div>
              )}
              
              <NodePlacementMap 
                geojsonData={coordsChanged || runningAnalysis ? null : geojsonData} 
                layerControls={layerControls}
                selectedRisk={selectedRisk}
                searchQuery={searchQuery}
                onNodeSelect={setSelectedNode}
                selectedNode={selectedNode}
                previewPanelCoords={previewPanelCoords}
              />
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-64 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Node Type Distribution</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierChartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tierChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-64 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Distribution</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar: Selected Node Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-8rem)] sticky top-6 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <Hexagon className="w-4 h-4 mr-2 text-slate-500" />
                Selected Node Details
              </h3>
            </div>
            
            {!selectedNode ? (
              <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center flex-1">
                <Target className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm">Select a node on the map to view detailed placement justifications.</p>
              </div>
            ) : (
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedNode.properties.id || "Unknown ID"}</h4>
                  <div className="flex space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      selectedNode.properties.node_tier === 'Full' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      selectedNode.properties.node_tier === 'Crack' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Tier: {selectedNode.properties.node_tier}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      selectedNode.properties.risk_level === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedNode.properties.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Risk: {selectedNode.properties.risk_level}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Why was this sensor recommended?</h5>
                  <ul className="space-y-2">
                    {getExplanation(selectedNode).map((reason, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start">
                        <span className="text-cyan-500 mr-2 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Physical Properties</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Subsidence</p>
                      <p className="text-sm font-medium text-slate-800">{selectedNode.properties.subsidence_mm?.toFixed(2)} mm</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Tilt</p>
                      <p className="text-sm font-medium text-slate-800">{selectedNode.properties.tilt_deg?.toFixed(4)}°</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Strain</p>
                      <p className="text-sm font-medium text-slate-800">{selectedNode.properties.strain_ue?.toFixed(2)} μe</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Risk Score</p>
                      <p className="text-sm font-medium text-slate-800">{selectedNode.properties.risk_score?.toFixed(3)} / 4.0</p>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 pt-2">Geospatial</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Coordinates</p>
                      <p className="text-sm font-medium text-slate-800 font-mono bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">
                        {selectedNode.geometry.coordinates[1].toFixed(5)}, {selectedNode.geometry.coordinates[0].toFixed(5)}
                      </p>
                    </div>
                    
                    {selectedNode.properties.zone_name && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Risk Zone</p>
                        <p className="text-sm font-medium text-slate-800">{selectedNode.properties.zone_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};
