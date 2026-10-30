'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { DatasetRecord, ProvenanceType } from '@/lib/types';
import { IngestionJob } from '@/lib/types-phase4a';
import { inspectFile, getDatasetManifest, getManifestStats } from '@/lib/services/ingestion.service';

const PROVENANCE_COLOURS: Record<string, string> = {
  Observed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Derived: 'bg-[#E8D9BF] text-[#454640] border-[#D4C4A8]',
  Synthetic: 'bg-purple-50 text-purple-700 border-purple-200',
  Assumed: 'bg-amber-50 text-amber-700 border-amber-200',
  Unverified: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_COLOURS: Record<string, string> = {
  Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending_Licence: 'bg-amber-50 text-amber-700 border-amber-200',
  Synthetic_Only: 'bg-purple-50 text-purple-700 border-purple-200',
  Missing: 'bg-rose-50 text-rose-700 border-rose-200',
};

function QualityMeter({ score }: { score: number }) {
  const colour = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#E8E1D5] rounded-full overflow-hidden">
        <div className={`h-full ${colour} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-bold ${score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
        {score}/100
      </span>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Validating: 'bg-blue-50 text-blue-700 border-blue-200',
    Quarantined: 'bg-rose-50 text-rose-700 border-rose-200',
    Inspecting: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function DataInfrastructurePage() {
  const { datasets, addDatasetRecord, cables, snapshots } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'ingest' | 'manifest' | 'registry'>('ingest');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [provenanceTag, setProvenanceTag] = useState<ProvenanceType>('Observed');
  const [datasetName, setDatasetName] = useState<string>('');
  const [inspecting, setInspecting] = useState(false);
  const [currentJob, setCurrentJob] = useState<IngestionJob | null>(null);
  const [completedJobs, setCompletedJobs] = useState<IngestionJob[]>([]);

  const manifest = useMemo(() => getDatasetManifest(), []);
  const manifestStats = useMemo(() => getManifestStats(), []);
  const [manifestFilter, setManifestFilter] = useState('all');
  const [manifestSearch, setManifestSearch] = useState('');

  const filteredManifest = useMemo(() => {
    return manifest.filter((e) => {
      const matchFilter = manifestFilter === 'all' || e.status === manifestFilter || e.evidenceClass === manifestFilter;
      const matchSearch = manifestSearch === '' ||
        e.inferredName.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        e.sheetName.toLowerCase().includes(manifestSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [manifest, manifestFilter, manifestSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadStatus('');
      setCurrentJob(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadStatus('');
      setCurrentJob(null);
    }
  };

  const handleInspect = async () => {
    if (!selectedFile) return;
    setInspecting(true);
    setCurrentJob(null);
    setUploadStatus('');

    try {
      const job = await inspectFile(selectedFile, provenanceTag, datasetName);
      setCurrentJob(job);

      if (job.status !== 'Quarantined') {
        const newRecord: DatasetRecord = {
          id: job.jobId,
          name: datasetName || selectedFile.name,
          fileType: job.format,
          rowCount: job.rowsTotal,
          fileSizeKb: Math.round(selectedFile.size / 1024) || 1,
          uploadedAt: new Date().toISOString(),
          provenance: provenanceTag,
          validationStatus: job.errors.filter((e) => e.severity === 'error').length > 0 ? 'Warnings' : 'Valid',
          validationErrors: job.errors.filter((e) => e.severity === 'error').map((e) => e.reason),
          description: `Ingested via pipeline. Quality score: ${job.qualityScore}/100. Zone: ${job.zone}.`,
        };
        addDatasetRecord(newRecord);
        setUploadStatus(`Dataset "${newRecord.name}" registered into the Digital Twin Registry.`);
        setCompletedJobs((prev) => [{ ...job, status: 'Complete' }, ...prev]);
      } else {
        setUploadStatus(`Dataset quarantined: ${job.errors[0]?.reason ?? 'validation failed'}`);
        setCompletedJobs((prev) => [job, ...prev]);
      }
    } catch (err) {
      setUploadStatus('Inspection failed: ' + String(err));
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 07 // DATA MANAGEMENT & DIGITAL TWIN REGISTRY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">CENTRAL HUB</span>
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl text-[#0E2A47] tracking-tight mt-1">
            Data & Infrastructure Hub
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Staged ingestion pipeline: inspect → validate → quarantine or publish.
            All records carry evidence classification. Invalid records are never silently discarded.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E0D7C9] text-right shadow-2xs">
            <span className="font-mono text-[10px] text-[#5A738A] uppercase">Twin Registry</span>
            <p className="font-mono text-sm font-bold text-[#0E2A47]">
              {datasets.length} Datasets · {cables.length} Cables
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EBE0] rounded-xl p-1 w-fit flex-wrap">
        {(['ingest', 'manifest', 'registry'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-white text-[#C87954] shadow-xs' : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'ingest' ? 'Ingestion Pipeline' : tab === 'manifest' ? `Dataset Manifest (${manifest.length})` : `Registry (${datasets.length})`}
          </button>
        ))}
      </div>

      {/* Ingestion Tab */}
      {activeTab === 'ingest' && (
        <div className="space-y-5">
          {/* Pipeline Stages */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
            <h2 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-4">
              Ingestion Pipeline
            </h2>
            <div className="flex items-center gap-1 flex-wrap">
              {['Upload', '→', 'Format Detection', '→', 'Schema Scan', '→', 'Validation', '→', 'Quarantine / Publish', '→', 'Provenance Tag', '→', 'Version'].map((step, i) => (
                step === '→' ? (
                  <span key={i} className="text-[#A69B89] font-mono text-xs">→</span>
                ) : (
                  <span key={i} className="px-2 py-1 bg-[#FAF7F2] border border-[#E2DBD0] rounded-lg text-[10px] font-mono text-[#454640]">
                    {step}
                  </span>
                )
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* File Upload Area */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
                <h2 className="font-sans font-bold text-sm text-[#0E2A47]">Ingest Subsea GIS & Telemetry Dataset</h2>

                {/* Drop Zone */}
                <div
                  className="border-2 border-dashed border-[#D5CCBC] rounded-xl p-6 text-center hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,.geojson,.gpkg,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#EAF1F8] flex items-center justify-center text-[#185382]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-[#0E2A47]">
                      {selectedFile ? selectedFile.name : 'Click or drag GIS files here'}
                    </p>
                    <p className="font-mono text-[10px] text-[#69829A]">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'CSV, GeoJSON, JSON (Max 50MB)'}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-1">Dataset Name</label>
                    <input
                      type="text"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="e.g. Submarine Cable Routes 2026"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs text-[#0E2A47] focus:outline-none focus:border-[#C87954]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-1">Evidence Classification</label>
                    <select
                      value={provenanceTag}
                      onChange={(e) => setProvenanceTag(e.target.value as ProvenanceType)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs text-[#0E2A47] focus:outline-none focus:border-[#C87954]"
                    >
                      <option value="Observed">Observed (Authoritative GIS / Hardware)</option>
                      <option value="Derived">Derived (Computed / Processed)</option>
                      <option value="Synthetic">Synthetic (Testing / Benchmarking)</option>
                      <option value="Assumed">Assumed (Consortium Estimates)</option>
                      <option value="Unverified">Unverified (Third-Party — not for operational use)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleInspect}
                  disabled={!selectedFile || inspecting}
                  className="btn-primary w-full py-2.5 disabled:opacity-40 font-mono tracking-wider"
                >
                  {inspecting ? 'INSPECTING & VALIDATING...' : 'INSPECT & VALIDATE FILE'}
                </button>

                {uploadStatus && (
                  <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                    uploadStatus.includes('quarantined') || uploadStatus.includes('failed')
                      ? 'bg-rose-50 border border-rose-300 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  }`}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {uploadStatus.includes('quarantined') ? (
                        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                      ) : (
                        <polyline points="20 6 9 17 4 12" />
                      )}
                    </svg>
                    <span>{uploadStatus}</span>
                  </div>
                )}
              </div>

              {/* Recent Job History */}
              {completedJobs.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-3">
                  <h3 className="font-sans font-bold text-sm text-[#0E2A47]">Ingestion Log</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {completedJobs.map((job) => (
                      <div key={job.jobId} className={`p-2.5 rounded-xl border text-xs ${job.status === 'Quarantined' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[#0E2A47]">{job.datasetName}</p>
                          <JobStatusBadge status={job.status} />
                        </div>
                        <div className="flex gap-3 font-mono text-[10px] text-[#59738A]">
                          <span>{job.rowsTotal} rows</span>
                          <span>Quality: {job.qualityScore}/100</span>
                          <span>Zone: {job.zone}</span>
                        </div>
                        {job.errors.length > 0 && (
                          <p className="text-[10px] text-rose-700 mt-1">
                            {job.errors[0]?.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inspection Results */}
            <div className="lg:col-span-7 space-y-4">
              {currentJob ? (
                <>
                  {/* Job Overview */}
                  <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
                      <div>
                        <h3 className="font-sans font-bold text-sm text-[#0E2A47]">Inspection Report</h3>
                        <p className="text-[10px] text-[#59738A] font-mono">Job: {currentJob.jobId}</p>
                      </div>
                      <JobStatusBadge status={currentJob.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { v: currentJob.rowsTotal.toLocaleString(), l: 'Total Rows' },
                        { v: currentJob.rowsValid.toLocaleString(), l: 'Valid Rows' },
                        { v: currentJob.rowsQuarantined.toLocaleString(), l: 'Quarantined' },
                      ].map((s) => (
                        <div key={s.l} className="text-center p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5]">
                          <p className="font-mono text-lg font-bold text-[#0E2A47]">{s.v}</p>
                          <p className="text-[10px] text-[#59738A]">{s.l}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#69829A] mb-1.5 block">Data Quality Score</label>
                      <QualityMeter score={currentJob.qualityScore} />
                    </div>

                    {currentJob.crsDetected && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="text-[10px] font-mono text-emerald-800">CRS detected: {currentJob.crsDetected}</span>
                      </div>
                    )}
                  </div>

                  {/* Schema */}
                  {currentJob.schema.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
                      <h3 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-3">Detected Schema ({currentJob.schema.length} fields)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                              <th className="py-2 px-2 text-left">Field</th>
                              <th className="py-2 px-2 text-left">Type</th>
                              <th className="py-2 px-2 text-right">Missing</th>
                              <th className="py-2 px-2 text-left">Samples</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0EBE0]">
                            {currentJob.schema.map((f) => (
                              <tr key={f.name} className="hover:bg-[#FAF7F2]">
                                <td className="py-1.5 px-2 font-mono font-bold text-[#0E2A47]">{f.name}</td>
                                <td className="py-1.5 px-2">
                                  <span className={`px-1 py-0.5 rounded text-[9px] font-mono border ${f.inferredType === 'number' ? 'bg-blue-50 text-blue-700 border-blue-200' : f.inferredType === 'date' ? 'bg-green-50 text-green-700 border-green-200' : f.inferredType === 'geometry' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {f.inferredType}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  <span className={f.missingCount > 0 ? 'text-amber-700' : 'text-emerald-700'}>{f.missingCount}</span>
                                </td>
                                <td className="py-1.5 px-2 font-mono text-[10px] text-[#59738A] max-w-32 truncate">
                                  {f.sampleValues.slice(0, 2).join(', ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Errors & Warnings */}
                  {currentJob.errors.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
                      <h3 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-3">
                        Validation Issues ({currentJob.errors.length})
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {currentJob.errors.map((err, i) => (
                          <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-[10px] font-mono ${err.severity === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                            <span className="font-bold flex-shrink-0">{err.severity === 'error' ? 'ERR' : 'WRN'}</span>
                            <span>{err.rowIndex !== null ? `Row ${err.rowIndex} · ` : ''}{err.field}: {err.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail */}
                  <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
                    <h3 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-3">Audit Trail</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[10px] text-[#59738A]">
                      {currentJob.auditTrail.map((entry, i) => (
                        <p key={i} className="leading-snug">{entry}</p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#FAF7F2] rounded-2xl border border-[#E2DBD0] p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E8D9BF] flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-[#A69B89]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-[#0E2A47]">Select a file to begin inspection</p>
                  <p className="text-[10px] text-[#59738A] font-mono max-w-xs mx-auto">
                    Runs coordinate bounds checking, duplicate ID detection, schema detection, and evidence classification.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dataset Manifest Tab */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { v: manifestStats.total, l: 'Total Sheets', c: 'text-[#0E2A47]' },
              { v: manifestStats.readyCount, l: 'Ready', c: 'text-emerald-700' },
              { v: manifestStats.pendingLicence, l: 'Pending Licence ⚠', c: 'text-amber-700' },
              { v: manifestStats.syntheticCount, l: 'Synthetic', c: 'text-purple-700' },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-xl border border-[#E2DBD0] p-4 text-center shadow-xs">
                <p className={`font-mono text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-[#59738A] font-mono mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Licence Warning */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-[10px] font-mono text-amber-800">
              ⚠ <strong>Licence Warning:</strong> Groups A and C contain data from external providers (NOAA, GeoCables).
              Source licence must be verified before redistribution. Datasets marked Pending_Licence are excluded from public-facing features.
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search datasets..."
              value={manifestSearch}
              onChange={(e) => setManifestSearch(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954] w-64"
            />
            <select
              value={manifestFilter}
              onChange={(e) => setManifestFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954]"
            >
              <option value="all">All ({manifest.length})</option>
              <option value="Ready">Ready ({manifestStats.readyCount})</option>
              <option value="Pending_Licence">Pending Licence ({manifestStats.pendingLicence})</option>
              <option value="SYNTHETIC">Synthetic ({manifestStats.syntheticCount})</option>
              <option value="OBSERVED_SOURCE">Observed ({manifestStats.observedCount})</option>
            </select>
          </div>

          {/* Manifest Table */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase bg-[#FAF7F2]">
                    <th className="py-2.5 px-3">Dataset</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Evidence</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Intended Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0]">
                  {filteredManifest.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[#0E2A47] text-xs">{entry.inferredName}</p>
                        <p className="text-[9px] font-mono text-[#69829A]">{entry.sheetName}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#185382] text-[10px]">{entry.group.toUpperCase()}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${PROVENANCE_COLOURS[entry.evidenceClass.replace('_SOURCE', '').replace('OBSERVED', 'Observed').replace('SYNTHETIC', 'Synthetic').replace('DERIVED', 'Derived')] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {entry.evidenceClass}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${STATUS_COLOURS[entry.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {entry.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-[#454640]">{entry.ingestionZone}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono text-[9px] font-bold ${entry.priority === 'P1' ? 'text-rose-700' : entry.priority === 'P2' ? 'text-amber-700' : 'text-[#59738A]'}`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-[#59738A] max-w-xs">
                        {entry.intendedUse.slice(0, 80)}{entry.intendedUse.length > 80 ? '...' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Registry Tab */}
      {activeTab === 'registry' && (
        <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
            <div>
              <h2 className="font-sans font-bold text-base text-[#0E2A47]">Registered Datasets & Provenance Archive</h2>
              <p className="font-mono text-[10px] text-[#59738A]">Immutable catalog of ingested subsea data layers</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#0E2A47] bg-[#F5F0E6] px-2.5 py-1 rounded-lg">
              {datasets.length} Datasets
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Dataset Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Provenance</th>
                  <th className="py-2.5 px-3">Validation</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#0E2A47]">{ds.name}</p>
                      <p className="text-[10px] text-[#59738A] leading-tight mt-0.5">{ds.description}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#185382]">{ds.fileType}</td>
                    <td className="py-3 px-3 font-mono text-[#0E2A47]">{ds.rowCount.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-[#0E2A47]">{ds.fileSizeKb} KB</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${PROVENANCE_COLOURS[ds.provenance] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {ds.provenance}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {ds.validationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-[#69829A]">
                      {new Date(ds.uploadedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
