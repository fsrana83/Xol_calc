/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Claim, TreatyConfig, OverallCalculationSummary } from '../types/reinsurance';
import { formatCurrency, formatPercent, OMANI_RIAL_SIGN } from '../utils/reinsuranceEngine';
import { resolveClaimCoordinates, GeoLocation } from '../utils/geospatialCoords';
import {
  MapPin,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Navigation,
  Layers,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  Compass,
} from 'lucide-react';

interface GeospatialClaimsImpactProps {
  claims: Claim[];
  treaties: TreatyConfig;
  summary?: OverallCalculationSummary;
  scenarioTitle: string;
}

interface GeocodedClaim {
  claim: Claim;
  geo: GeoLocation;
  severityTier: 'critical' | 'high' | 'moderate' | 'low';
}

// Controller component to pan map to coordinates programmatically
const MapController: React.FC<{ targetCenter: { lat: number; lng: number } | null; zoom?: number }> = ({
  targetCenter,
  zoom = 10,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map && targetCenter) {
      map.panTo(targetCenter);
      map.setZoom(zoom);
    }
  }, [map, targetCenter, zoom]);

  return null;
};

export const GeospatialClaimsImpact: React.FC<GeospatialClaimsImpactProps> = ({
  claims,
  treaties,
  scenarioTitle,
}) => {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyAbqw8ujo7TLmM_Gi7AXB-GZcTnnnao9MA';

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedLob, setSelectedLob] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [targetCenter, setTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [targetZoom, setTargetZoom] = useState<number>(7);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Enrich claims with geospatial coordinates & severity tiers
  const geocodedClaims = useMemo<GeocodedClaim[]>(() => {
    const catAttachment = treaties.catXol.attachmentPoint; // e.g. 200k
    const riskCap = treaties.riskXol.attachmentPoint + treaties.riskXol.limit; // e.g. 50k
    const riskAttach = treaties.riskXol.attachmentPoint; // e.g. 10k

    return claims.map((claim) => {
      const geo = resolveClaimCoordinates(claim.location, claim.id);
      let severityTier: GeocodedClaim['severityTier'] = 'low';

      if (claim.grossLoss >= catAttachment) {
        severityTier = 'critical';
      } else if (claim.grossLoss >= riskCap) {
        severityTier = 'high';
      } else if (claim.grossLoss >= riskAttach) {
        severityTier = 'moderate';
      }

      return {
        claim,
        geo,
        severityTier,
      };
    });
  }, [claims, treaties]);

  // Filtered claims based on UI filters
  const filteredClaims = useMemo(() => {
    return geocodedClaims.filter((item) => {
      const matchesLob =
        selectedLob === 'ALL' ||
        item.claim.lob === selectedLob ||
        (selectedLob === 'P&C Lines' &&
          (item.claim.lob === 'Commercial Property' ||
            item.claim.lob === 'Industrial Plant' ||
            item.claim.lob === 'Residential High-Value' ||
            item.claim.lob === 'Warehouse & Logistics' ||
            item.claim.lob === 'Energy & Marine'));

      const matchesSeverity =
        selectedSeverity === 'ALL' || item.severityTier === selectedSeverity;

      return matchesLob && matchesSeverity;
    });
  }, [geocodedClaims, selectedLob, selectedSeverity]);

  // Regional breakdown by Governorate
  const regionalSummary = useMemo(() => {
    const regionMap: Record<
      string,
      { count: number; totalGross: number; claims: Claim[]; lat: number; lng: number }
    > = {};

    filteredClaims.forEach((item) => {
      const gov = item.geo.governorate;
      if (!regionMap[gov]) {
        regionMap[gov] = {
          count: 0,
          totalGross: 0,
          claims: [],
          lat: item.geo.lat,
          lng: item.geo.lng,
        };
      }
      regionMap[gov].count += 1;
      regionMap[gov].totalGross += item.claim.grossLoss;
      regionMap[gov].claims.push(item.claim);
    });

    const totalGross = filteredClaims.reduce((s, c) => s + c.claim.grossLoss, 0);

    return Object.entries(regionMap)
      .map(([region, data]) => ({
        region,
        count: data.count,
        totalGross: data.totalGross,
        pctOfTotal: totalGross > 0 ? (data.totalGross / totalGross) * 100 : 0,
        lat: data.lat,
        lng: data.lng,
      }))
      .sort((a, b) => b.totalGross - a.totalGross);
  }, [filteredClaims]);

  // Selected claim object for InfoWindow
  const activeSelected = useMemo(() => {
    if (!selectedClaimId) return null;
    return geocodedClaims.find((item) => item.claim.id === selectedClaimId) || null;
  }, [selectedClaimId, geocodedClaims]);

  const totalPortfolioGross = filteredClaims.reduce((s, c) => s + c.claim.grossLoss, 0);

  // Helper to focus on region
  const handleFocusRegion = (lat: number, lng: number) => {
    setTargetCenter({ lat, lng });
    setTargetZoom(10);
  };

  const resetMapView = () => {
    setTargetCenter({ lat: 21.8, lng: 57.5 });
    setTargetZoom(6.5);
    setSelectedClaimId(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner / Introduction */}
      <div className="st-card p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Geospatial Claims Impact & Catastrophe Hotspot Radar
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Sultanate of Oman (&#x20c4;)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Visualize geospatial distribution and accumulation of claims in <em>&ldquo;{scenarioTitle}&rdquo;</em>. Identify geographic clash hotspots breaching the &#x20c4; 40K Risk XOL limit and &#x20c4; 2M Catastrophe layer across coastal and inland commercial zones.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Stats */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">Geocoded Claims</span>
            <span className="text-sm font-bold text-white font-mono">{filteredClaims.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">Aggregate Incurred</span>
            <span className="text-sm font-bold text-indigo-300 font-mono">
              {formatCurrency(totalPortfolioGross)}
            </span>
          </div>
          <button
            onClick={resetMapView}
            className="px-2.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Reset Map to Full Oman Overview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main Geospatial Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Center: Interactive Google Map (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Map Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            {/* LOB Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Line:</span>
              <select
                value={selectedLob}
                onChange={(e) => setSelectedLob(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="ALL">All LOBs</option>
                <option value="Motor">Motor</option>
                <option value="P&C Lines">P&C Lines</option>
                <option value="Medical Lines">Medical Lines</option>
                <option value="Group Life Lines">Group Life Lines</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span>Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="ALL">All Tiers</option>
                <option value="critical">🔴 Critical (&gt; &#x20c4; 200K / Cat XOL)</option>
                <option value="high">🟠 High (&#x20c4; 50K - 200K / Spillover)</option>
                <option value="moderate">🟡 Moderate (&#x20c4; 10K - 50K / Risk XOL)</option>
                <option value="low">🔵 Low (&lt; &#x20c4; 10K / Net Retained)</option>
              </select>
            </div>

            {/* Map Style Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px] font-semibold">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  mapType === 'roadmap' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Roadmap
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  mapType === 'satellite' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapType('terrain')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  mapType === 'terrain' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Terrain
              </button>
            </div>
          </div>

          {/* Google Maps Container (Explicit Height of 540px to prevent CF2 height collapse) */}
          <div className="w-full h-[540px] rounded-xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100">
            <APIProvider apiKey={apiKey} region="OM">
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={{ lat: 21.8, lng: 57.5 }}
                defaultZoom={6.5}
                mapTypeId={mapType}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling="cooperative"
                style={{ width: '100%', height: '100%' }}
              >
                <MapController targetCenter={targetCenter} zoom={targetZoom} />

                {/* Render Advanced Markers for each Claim */}
                {filteredClaims.map((item) => {
                  const isSelected = selectedClaimId === item.claim.id;

                  // Severity styling for custom pin
                  const pinBg =
                    item.severityTier === 'critical'
                      ? 'bg-rose-600 ring-rose-400'
                      : item.severityTier === 'high'
                      ? 'bg-amber-500 ring-amber-300'
                      : item.severityTier === 'moderate'
                      ? 'bg-yellow-500 ring-yellow-200'
                      : 'bg-sky-500 ring-sky-300';

                  const badgeBorder =
                    item.severityTier === 'critical'
                      ? 'border-rose-700'
                      : item.severityTier === 'high'
                      ? 'border-amber-600'
                      : item.severityTier === 'moderate'
                      ? 'border-yellow-600'
                      : 'border-sky-600';

                  return (
                    <AdvancedMarker
                      key={item.claim.id}
                      position={{ lat: item.geo.lat, lng: item.geo.lng }}
                      onClick={() => setSelectedClaimId(item.claim.id)}
                      title={`${item.claim.insuredName} - ${formatCurrency(item.claim.grossLoss)}`}
                    >
                      <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
                        {/* Animated radar ripple for critical claims */}
                        {item.severityTier === 'critical' && (
                          <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping pointer-events-none"></span>
                        )}

                        {/* Interactive Marker Pin */}
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-white font-mono text-[10px] font-bold shadow-lg border ${pinBg} ${badgeBorder} transition-all duration-150 ${
                            isSelected
                              ? 'scale-125 ring-4 ring-indigo-400 z-30'
                              : 'hover:scale-110'
                          }`}
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>
                            {item.claim.grossLoss >= 1000000
                              ? `${(item.claim.grossLoss / 1000000).toFixed(1)}M`
                              : item.claim.grossLoss >= 1000
                              ? `${Math.round(item.claim.grossLoss / 1000)}k`
                              : item.claim.grossLoss}
                          </span>
                        </div>

                        {/* Small stem triangle */}
                        <div
                          className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] mx-auto ${
                            item.severityTier === 'critical'
                              ? 'border-t-rose-600'
                              : item.severityTier === 'high'
                              ? 'border-t-amber-500'
                              : item.severityTier === 'moderate'
                              ? 'border-t-yellow-500'
                              : 'border-t-sky-500'
                          }`}
                        ></div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Selected Claim InfoWindow */}
                {activeSelected && (
                  <InfoWindow
                    position={{
                      lat: activeSelected.geo.lat,
                      lng: activeSelected.geo.lng,
                    }}
                    onCloseClick={() => setSelectedClaimId(null)}
                  >
                    <div className="p-1 max-w-xs text-slate-900 font-sans text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {activeSelected.claim.claimNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            activeSelected.severityTier === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : activeSelected.severityTier === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {activeSelected.severityTier} Threat
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs leading-tight mb-1">
                        {activeSelected.claim.insuredName}
                      </h4>

                      <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {activeSelected.claim.location} ({activeSelected.geo.governorate})
                        </span>
                      </div>

                      {/* Financial Breakdown Table */}
                      <div className="bg-slate-50 rounded p-2 border border-slate-200 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Gross Loss:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(activeSelected.claim.grossLoss)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-blue-700">
                          <span>QS Ceded (20%):</span>
                          <span>
                            {formatCurrency(
                              treaties.quotaShare.enabled
                                ? activeSelected.claim.grossLoss *
                                    ((100 - treaties.quotaShare.retentionPercent) / 100)
                                : 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-amber-700">
                          <span>Risk XOL Recov:</span>
                          <span>
                            {formatCurrency(
                              Math.min(
                                treaties.riskXol.limit,
                                Math.max(
                                  0,
                                  activeSelected.claim.grossLoss *
                                    (treaties.quotaShare.retentionPercent / 100) -
                                    treaties.riskXol.attachmentPoint
                                )
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-800 font-bold border-t border-slate-200 pt-1">
                          <span>Event:</span>
                          <span className="font-sans text-[10px] text-indigo-700 truncate max-w-[130px]">
                            {activeSelected.claim.eventName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>

            {/* Bottom Floating Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 hidden sm:block">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono block">
                Catastrophe Severity Thresholds
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span className="text-slate-700">&gt; &#x20c4; 200K (Cat XOL)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-700">&#x20c4; 50K - 200K (Spillover)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="text-slate-700">&#x20c4; 10K - 50K (Risk XOL)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span className="text-slate-700">&lt; &#x20c4; 10K (Retained)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Regional Catastrophe Hotspots Radar & Exposure Leaderboard (4 Columns) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Top Regional Exposure Card */}
          <div className="st-card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Governorate Clash Concentration
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {regionalSummary.length} Regions
              </span>
            </div>

            {/* List of Regions */}
            <div className="space-y-3">
              {regionalSummary.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFocusRegion(item.lat, item.lng)}
                  className="p-2.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 rounded-lg cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-700 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      {item.region}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.totalGross)}
                    </span>
                  </div>

                  {/* Progress bar representing share of portfolio loss */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-1">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-rose-500'
                          : idx === 1
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, item.pctOfTotal))}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      {item.count} claim{item.count > 1 ? 's' : ''} ({item.pctOfTotal.toFixed(1)}% of total)
                    </span>
                    <span className="text-indigo-600 text-[10px] font-semibold group-hover:underline">
                      Fly to region →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catastrophe Underwriting Recommendations */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Underwriting Hotspot Insight</span>
            </div>
            <p className="text-[11px] text-indigo-950 leading-relaxed">
              Oman coastal corridors between <strong>Sohar Port</strong>, <strong>Barka</strong>, and <strong>Muscat</strong> represent high multi-line accumulation risk during Arabian Sea Cyclones. The coexistence of heavy commercial property and motor vehicle fleets in Wattayah and Sohar Freezone triggers simultaneous Quota Share and Cat XOL layer attachment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
