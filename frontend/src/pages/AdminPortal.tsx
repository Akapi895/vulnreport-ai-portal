import { useState, useEffect } from 'react';
import { ShieldAlert, Users, FileText, Activity, AlertTriangle, Eye, RefreshCw, Layers } from 'lucide-react';
import { api, type AuditLog, type User, type Report, type LabStatus } from '../api';

export default function AdminPortal() {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'users' | 'reports' | 'status'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<LabStatus | null>(null);
  const [adminFlag, setAdminFlag] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeSubTab]);

  useEffect(() => {
    fetchAdminFlag();
  }, []);

  const fetchAdminFlag = async () => {
    try {
      const data = await api.admin.getFlag();
      setAdminFlag(data.flag);
      setShowFlagModal(true);
    } catch (err) {
      console.error('Failed to fetch admin flag:', err);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'logs') {
        const logData = await api.admin.getAuditLogs();
        setLogs(logData);
      } else if (activeSubTab === 'users') {
        const userData = await api.admin.getUsers();
        setUsers(userData);
      } else if (activeSubTab === 'reports') {
        const reportData = await api.admin.getReports();
        setReports(reportData);
      } else if (activeSubTab === 'status') {
        const statusData = await api.admin.getStatus();
        setStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {showFlagModal && adminFlag && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="cyber-card" style={{
            width: 'min(560px, calc(100vw - 2rem))',
            padding: '1.5rem',
            borderColor: 'var(--warning)',
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.16)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '0.75rem' }}>
              <ShieldAlert size={20} /> ADMIN ACCESS CONFIRMED
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1rem' }}>
              Final lab flag unlocked after authenticating as admin.
            </p>
            <div style={{
              padding: '0.9rem',
              border: '1px dashed var(--warning)',
              borderRadius: '4px',
              backgroundColor: 'rgba(245, 158, 11, 0.06)',
              color: 'var(--warning)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              {adminFlag}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="cyber-btn cyber-btn-primary" onClick={() => setShowFlagModal(false)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
          <ShieldAlert size={20} /> ADMINISTRATIVE CONTROL PORTAL
        </h2>
        
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            onClick={() => { setActiveSubTab('logs'); setSelectedLog(null); }}
            className={`cyber-btn ${activeSubTab === 'logs' ? 'cyber-btn-primary' : ''}`}
            style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
          >
            <Activity size={12} /> AI AUDIT LOGS
          </button>
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`cyber-btn ${activeSubTab === 'users' ? 'cyber-btn-primary' : ''}`}
            style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
          >
            <Users size={12} /> USER MANAGER
          </button>
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`cyber-btn ${activeSubTab === 'reports' ? 'cyber-btn-primary' : ''}`}
            style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
          >
            <FileText size={12} /> ALL REPORTS
          </button>
          <button 
            onClick={() => setActiveSubTab('status')}
            className={`cyber-btn ${activeSubTab === 'status' ? 'cyber-btn-primary' : ''}`}
            style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
          >
            <Layers size={12} /> LAB SETTINGS
          </button>
        </div>
      </div>

      <div className="cyber-card" style={{ flex: 1, padding: '1.25rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {activeSubTab === 'logs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', height: '100%', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>EVENT LOGGING FLOW (MAX 200)</span>
                <button onClick={fetchAdminData} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                  <RefreshCw size={12} className={loading ? 'scanlines-anim' : ''} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', marginTop: '0.75rem' }}>
                {loading ? (
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Polling event queue...</div>
                ) : logs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '2rem' }}>No AI events recorded yet.</div>
                ) : (
                  logs.map((log) => {
                    const hasLeak = log.tool_output && (log.tool_output.includes('DB_PASSWORD') || log.tool_output.includes('vulnpass123'));
                    return (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          backgroundColor: selectedLog?.id === log.id 
                            ? 'rgba(245, 158, 11, 0.08)' 
                            : hasLeak ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                          borderLeft: selectedLog?.id === log.id 
                            ? '3px solid var(--warning)' 
                            : hasLeak ? '3px solid var(--danger)' : '3px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          <span>USER ID: {log.user_id || 'ANON'}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-main)' }}>Action: {log.action}</span>
                          {log.tool_name && (
                            <span className="cyber-badge cyber-badge-blue" style={{ fontSize: '8px' }}>
                              tool: {log.tool_name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                          Prompt: {log.prompt || '[Direct system call]'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--warning)', fontWeight: 600 }}>
                DETAILED EVENT TRACE
              </div>

              {selectedLog ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Event ID:</span> {selectedLog.id}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Action:</span> {selectedLog.action}
                  </div>

                  <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem' }}>PROMPT INPUT:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{selectedLog.prompt || '[Direct execute]'}</div>
                  </div>

                  {selectedLog.retrieved_context && (
                    <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem' }}>RETRIEVED RAG CONTEXT:</div>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>{selectedLog.retrieved_context}</pre>
                    </div>
                  )}

                  {selectedLog.tool_name && (
                    <div style={{ 
                      border: '1px solid var(--border)', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      backgroundColor: 'rgba(0,0,0,0.25)' 
                    }}>
                      <div style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: '0.25rem' }}>TOOL INVOCATION:</div>
                      <div>Name: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedLog.tool_name}</span></div>
                      <div>Input:
                        <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.25rem', marginTop: '0.25rem' }}>
                          {JSON.stringify(selectedLog.tool_input, null, 2)}
                        </pre>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>Output:
                        <pre style={{ 
                          backgroundColor: 'rgba(0,0,0,0.3)', 
                          padding: '0.25rem', 
                          marginTop: '0.25rem', 
                          whiteSpace: 'pre-wrap',
                          color: (selectedLog.tool_output && (selectedLog.tool_output.includes('DB_PASSWORD') || selectedLog.tool_output.includes('vulnpass123'))) ? 'var(--danger)' : '#10b981'
                        }}>
                          {selectedLog.tool_output}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem' }}>FINAL COMPLETED RESPONSE:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{selectedLog.response}</div>
                  </div>

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
                  <Eye size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  Select an audit trace to expand prompt parameters and tool telemetry.
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div style={{ overflowY: 'auto', height: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--accent)' }}>
                  <th style={{ padding: '0.75rem' }}>USER ID</th>
                  <th style={{ padding: '0.75rem' }}>USERNAME</th>
                  <th style={{ padding: '0.75rem' }}>EMAIL</th>
                  <th style={{ padding: '0.75rem' }}>DISPLAY NAME</th>
                  <th style={{ padding: '0.75rem' }}>ROLE</th>
                  <th style={{ padding: '0.75rem' }}>CREATED AT</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '1rem', color: 'var(--text-muted)' }}>Querying DB table users...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{u.id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>{u.display_name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`cyber-badge ${u.role === 'admin' ? 'cyber-badge-orange' : 'cyber-badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'reports' && (
          <div style={{ overflowY: 'auto', height: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--accent)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>OWNER</th>
                  <th style={{ padding: '0.75rem' }}>TITLE</th>
                  <th style={{ padding: '0.75rem' }}>CVE ID</th>
                  <th style={{ padding: '0.75rem' }}>SEVERITY</th>
                  <th style={{ padding: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem' }}>CREATED AT</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '1rem', color: 'var(--text-muted)' }}>Querying DB table reports...</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{r.id}</td>
                    <td style={{ padding: '0.75rem' }}>ID: {r.owner_id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.title}</td>
                    <td style={{ padding: '0.75rem' }}>{r.cve_id || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`cyber-badge ${
                        r.severity === 'critical' ? 'cyber-badge-red' :
                        r.severity === 'high' ? 'cyber-badge-orange' :
                        r.severity === 'medium' ? 'cyber-badge-blue' : 'cyber-badge-green'
                      }`}>
                        {r.severity || 'low'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{r.status}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'status' && (
          <div style={{ overflowY: 'auto', height: '100%', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              LAB SETTINGS METADATA
            </h3>

            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Retrieving system parameters...</div>
            ) : status ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>
                
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>LAB MODE ACTIVE:</span>
                  <span style={{ color: status.lab_mode ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {status.lab_mode ? 'TRUE' : 'FALSE'}
                  </span>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.75rem' }}>VULNERABILITY FLAGS STATUS:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      <span>ENABLE_VULN_NOTE_IDOR:</span>
                      <span style={{ color: status.vuln_flags.note_idor ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {status.vuln_flags.note_idor ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      <span>ENABLE_VULN_FETCH_HEADER_FORWARD:</span>
                      <span style={{ color: status.vuln_flags.fetch_header_forward ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {status.vuln_flags.fetch_header_forward ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      <span>ENABLE_VULN_MCP_SECRET_LEAK:</span>
                      <span style={{ color: status.vuln_flags.mcp_secret_leak ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {status.vuln_flags.mcp_secret_leak ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                      <span>ENABLE_VULN_RAG_POISONING:</span>
                      <span style={{ color: status.vuln_flags.rag_poisoning ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {status.vuln_flags.rag_poisoning ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.5rem' }}>SEED COUNTS:</div>
                  <div>Users In DB: {status.users}</div>
                  <div>Reports In DB: {status.reports}</div>
                  <div>Internal Assets: {status.internal_assets}</div>
                </div>

                <div style={{ 
                  border: '1px dashed var(--warning)', 
                  backgroundColor: 'rgba(245, 158, 11, 0.02)',
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  color: 'var(--warning)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={16} /> 
                  These parameters are configured in docker-compose.yml. To toggle vulnerability states, update the environment settings and restart the docker compose cluster.
                </div>

              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No lab settings payload returned.</div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
