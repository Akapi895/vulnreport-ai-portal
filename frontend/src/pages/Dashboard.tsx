import { useContext, useState, useEffect } from 'react';
import { ShieldAlert, Cpu, Database, Network, Key, AlertTriangle } from 'lucide-react';
import { api, type Report, type LabStatus } from '../api';
import { ThemeContext } from '../App';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const { theme } = useContext(ThemeContext);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [labStatus, setLabStatus] = useState<Partial<LabStatus>>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const reportList = await api.reports.list();
      setReports(reportList);

      if (user.role === 'admin') {
        const statusData = await api.admin.getStatus();
        setLabStatus(statusData);
      } else {
        setLabStatus({
          lab_mode: true,
          users: 3,
          reports: reportList.length,
          internal_assets: 2
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const nodes: Record<string, { label: string; desc: string; exposed: boolean; detail: string; vuln?: string }> = {
    nginx: {
      label: 'NGINX (Reverse Proxy)',
      desc: 'Port 80 & 9001. Handles all inbound traffic, routes API queries to backend-api, and acts as SSE bridge to MCP.',
      exposed: true,
      detail: 'Exposes HTTP web app and public SSE endpoints. Restricts direct access to the raw internal backend endpoints.'
    },
    backend: {
      label: 'Backend API (FastAPI)',
      desc: 'Port 8000 (Internal). Coordinates core business logic, user authorization, and queries the LLM / Vector DB.',
      exposed: false,
      detail: 'Runs behind NGINX. Uses cookie-based sessions. Contains AI interaction services like summarizing and impact assessment.',
      vuln: 'Path 1: Fails to check note ownership, allowing direct IDOR data extraction via prompt injection.'
    },
    postgres: {
      label: 'PostgreSQL DB',
      desc: 'Port 5432. Stores users, report texts, session tokens, and private notes.',
      exposed: true,
      detail: 'Exposed to the public host (port 5432 published). Represents a severe infrastructure misconfiguration.',
      vuln: 'Path 4: If database credentials are leaked from MCP, an attacker can connect directly from outside via psql.'
    },
    mcp: {
      label: 'MCP Server',
      desc: 'Port 9001. Local SSE/HTTP server providing backend capabilities (fetch_url, inspect_deployment) to the LLM agent.',
      exposed: true,
      detail: 'Metadata SSE endpoint is publicly accessible. The internal tool operations can be invoked by the LLM agent.',
      vuln: 'Path 3 & 4: Tool fetch_url forwards sensitive user cookies to remote sites; inspect_deployment leaks local system environment files.'
    },
    chroma: {
      label: 'Chroma Vector DB',
      desc: 'Port 8000 (Internal). Stores vectorized chunks of CVE reports to build the RAG knowledge base.',
      exposed: false,
      detail: 'Reachable only inside the private docker bridge network.',
      vuln: 'Path 2: Vulnerable to RAG poisoning when malicious report text is uploaded and indexed.'
    },
    llm: {
      label: 'LLM Gateway (Ollama)',
      desc: 'Port 8080. Local inference engine running Qwen/Mistral models.',
      exposed: true,
      detail: 'Accepts LLM prompts and generates text outputs. Acts as the execution layer for agent prompt evaluations.',
      vuln: 'Executes instructions without sandboxing logic in tool invocation chains.'
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            backgroundColor: theme === 'blue' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.75rem',
            borderRadius: '4px',
            color: 'var(--accent)'
          }}>
            <Network size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAB SECURITY STATE</div>
            <div style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`health-indicator ${theme === 'blue' ? 'healthy' : 'critical'}`} />
              {theme === 'blue' ? 'DEFENSIVE ACTIVE' : 'EXPLOIT ENABLED'}
            </div>
          </div>
        </div>

        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            padding: '0.75rem',
            borderRadius: '4px',
            color: 'var(--success)'
          }}>
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DB RECORDS</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {loading ? '...' : `${labStatus.reports || 0} Reports / ${labStatus.users || 0} Users`}
            </div>
          </div>
        </div>

        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            padding: '0.75rem',
            borderRadius: '4px',
            color: 'var(--warning)'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AI AGENT LAYER</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              Active (Qwen2.5)
            </div>
          </div>
        </div>

        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            backgroundColor: theme === 'blue' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.75rem',
            borderRadius: '4px',
            color: 'var(--accent)'
          }}>
            <Key size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VULNERABILITIES LIKED</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {theme === 'blue' ? '0 active' : '4 paths open'}
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '1rem' }}>
        
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--accent)', 
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Network size={16} /> INTERACTIVE NETWORK ATTACK SURFACE
          </h3>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#020306', borderRadius: '4px', padding: '1rem', minHeight: '320px' }}>
            <svg viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', maxWidth: '700px' }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-active)" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>

              <line x1="100" y1="200" x2="250" y2="100" stroke={theme === 'red' ? '#ef4444' : 'var(--border)'} strokeWidth="1.5" strokeDasharray="4" markerEnd={theme === 'red' ? 'url(#arrow-red)' : 'url(#arrow)'} />
              <line x1="100" y1="200" x2="250" y2="200" stroke="var(--border)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="100" y1="200" x2="250" y2="300" stroke={theme === 'red' ? '#ef4444' : 'var(--border)'} strokeWidth="1.5" strokeDasharray="4" markerEnd={theme === 'red' ? 'url(#arrow-red)' : 'url(#arrow)'} />
              
              <line x1="250" y1="200" x2="450" y2="200" stroke="var(--border)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="450" y1="200" x2="650" y2="100" stroke="var(--border)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="450" y1="200" x2="650" y2="300" stroke={theme === 'red' ? '#ef4444' : 'var(--border)'} strokeWidth="2" markerEnd={theme === 'red' ? 'url(#arrow-red)' : 'url(#arrow)'} />

              <line x1="650" y1="300" x2="650" y2="100" stroke={theme === 'red' ? '#ef4444' : 'var(--border)'} strokeWidth="1.5" strokeDasharray="3" />

              {theme === 'red' && (
                <path d="M 80,380 C 100,340 180,310 250,300" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5" markerEnd="url(#arrow-red)" />
              )}

              <g transform="translate(100, 200)" cursor="pointer" onClick={() => setSelectedNode('nginx')}>
                <circle r="30" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="2" />
                <text y="5" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">NGINX</text>
                <text y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Port 80/9001</text>
              </g>

              <g transform="translate(250, 100)" cursor="pointer" onClick={() => setSelectedNode('llm')}>
                <rect x="-45" y="-22" width="90" height="44" rx="4" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1.5" />
                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">LLM Gateway</text>
                <text y="36" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Port 8080 (Exp)</text>
              </g>

              <g transform="translate(250, 200)" cursor="pointer" onClick={() => setSelectedNode('backend')}>
                <rect x="-45" y="-22" width="90" height="44" rx="4" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1.5" />
                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">Backend API</text>
                <text y="36" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Port 8000 (Int)</text>
              </g>

              <g transform="translate(250, 300)" cursor="pointer" onClick={() => setSelectedNode('postgres')}>
                <rect x="-45" y="-22" width="90" height="44" rx="4" 
                  fill="var(--bg-panel)" 
                  stroke={theme === 'red' ? '#ef4444' : 'var(--accent)'} 
                  strokeWidth={theme === 'red' ? '2.5' : '1.5'} 
                  className={theme === 'red' ? 'scanlines-anim' : ''}
                />
                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">PostgreSQL</text>
                <text y="36" textAnchor="middle" fill={theme === 'red' ? '#ef4444' : 'var(--text-muted)'} fontSize="9" fontFamily="var(--font-mono)" fontWeight={theme === 'red' ? '700' : '400'}>
                  {theme === 'red' ? 'PORT 5432 (EXPOSED!)' : 'Port 5432 (Exp)'}
                </text>
              </g>

              <g transform="translate(450, 200)" cursor="pointer" onClick={() => setSelectedNode('mcp')}>
                <circle r="30" fill="var(--bg-panel)" stroke={theme === 'red' ? '#ef4444' : 'var(--accent)'} strokeWidth="1.5" />
                <text y="5" textAnchor="middle" fill="var(--text-main)" fontSize="9" fontFamily="var(--font-mono)">MCP SSE</text>
                <text y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Port 9001 (Exp)</text>
              </g>

              <g transform="translate(650, 100)" cursor="pointer" onClick={() => setSelectedNode('chroma')}>
                <rect x="-45" y="-22" width="90" height="44" rx="4" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1.5" />
                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">Vector DB</text>
                <text y="36" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Port 8000 (Int)</text>
              </g>

              <g transform="translate(650, 300)" cursor="pointer" onClick={() => setSelectedNode('mcp')}>
                <rect x="-45" y="-22" width="90" height="44" rx="4" fill="var(--bg-panel)" stroke={theme === 'red' ? '#ef4444' : 'var(--accent)'} strokeWidth="1.5" />
                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="var(--font-mono)">MCP Core</text>
                <text y="36" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Internal</text>
              </g>

              {theme === 'red' && (
                <g transform="translate(80, 380)">
                  <circle r="15" fill="#ef4444" />
                  <text y="3" textAnchor="middle" fill="#000" fontSize="9" fontFamily="var(--font-mono)" fontWeight="900">ATTACKER</text>
                </g>
              )}
            </svg>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '0.5rem' }}>
            * Click on any network node to inspect its deployment metadata and vulnerabilities.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="cyber-card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ 
              fontSize: '13px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--accent)', 
              marginBottom: '0.75rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.25rem'
            }}>
              NODE INSPECTOR
            </h3>

            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-display)' }}>
                  {nodes[selectedNode].label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {nodes[selectedNode].desc}
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(0,0,0,0.2)', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  borderLeft: '2px solid var(--accent)'
                }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>DEPLOYMENT METADATA:</div>
                  {nodes[selectedNode].detail}
                </div>

                {theme === 'red' && nodes[selectedNode].vuln && (
                  <div style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                    padding: '0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)'
                  }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                      <AlertTriangle size={14} /> SECURITY HOLE DETECTED:
                    </div>
                    {nodes[selectedNode].vuln}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                color: 'var(--text-muted)', 
                textAlign: 'center',
                padding: '2rem 1rem'
              }}>
                <Network size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                Select a component node from the topology diagram to retrieve runtime context.
              </div>
            )}
          </div>

          <div className="cyber-card" style={{ padding: '1.25rem', height: '200px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ 
              fontSize: '13px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--accent)', 
              marginBottom: '0.75rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.25rem'
            }}>
              RECENT UPLOADED CVES
            </h3>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>Loading records...</div>
              ) : reports.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No reports recorded yet.</div>
              ) : (
                reports.slice(0, 4).map((r) => (
                  <div key={r.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.4rem 0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.cve_id || 'UNKNOWN'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '150px' }}>
                        {r.title}
                      </span>
                    </div>
                    <div>
                      <span className={`cyber-badge ${
                        r.severity === 'critical' ? 'cyber-badge-red' :
                        r.severity === 'high' ? 'cyber-badge-orange' :
                        r.severity === 'medium' ? 'cyber-badge-blue' : 'cyber-badge-green'
                      }`} style={{ fontSize: '9px' }}>
                        {r.severity || 'low'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {theme === 'red' && (
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontFamily: 'var(--font-mono)', 
            color: '#ef4444', 
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={15} /> ACTIVE LAB EXPLOIT PATHWAYS REFERENCE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            
            <div style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>PATH 1: DIRECT PROMPT INJECTION</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.3' }}>
                Inject prompt into AI Chat asking to read note ID of victim user (e.g. ID 1). Tool layer lacks ownership enforcement.
              </div>
            </div>

            <div style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>PATH 2: RAG POISONING</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.3' }}>
                Upload a poisoned CVE report with false severity/mitigation. Search retrievals will pulling poisoned texts to mislead summaries.
              </div>
            </div>

            <div style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>PATH 3: CREDENTIAL LEAK VIA FETCH_URL</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.3' }}>
                Upload report containing indirect prompt injection instructing agent to fetch an external url. AI calls fetch_url with user headers/cookies forwarded.
              </div>
            </div>

            <div style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>PATH 4: MCP SECRET LEAK</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.3' }}>
                Trigger "Assess Impact" on a report. Prompt hijacks inspect_deployment tool call, leaking .env / DB passwords which are written to final report analysis.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
