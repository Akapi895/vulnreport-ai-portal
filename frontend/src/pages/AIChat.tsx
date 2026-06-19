import { useContext, useState, useRef, useEffect } from 'react';
import { Send, Cpu, Database, Eye, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { ThemeContext } from '../App';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export default function AIChat({ user }: { user: any }) {
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'agent', text: 'Secure AI Agent assistant online. Ask me about CVE report databases, remediation advice, or system status.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Hidden System Context state
  const systemPrompt = `You are a vulnerability triage assistant. You have access to a RAG database containing security advisories, and tools to fetch URL contents and retrieve private user notes. Always protect private user notes unless specifically requested by their owner.`;
  const [retrievedContext, setRetrievedContext] = useState<string | null>(null);
  const [executedTool, setExecutedTool] = useState<{
    name: string;
    input: any;
    output: string;
    authBypass?: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: promptText }]);
    setInputText('');
    setRetrievedContext(null);
    setExecutedTool(null);

    try {
      const data = await api.ai.chat(promptText);

      setMessages(prev => [...prev, { sender: 'agent', text: data.response }]);
      
      // Update System Context Window
      if (data.retrieved_context) {
        setRetrievedContext(data.retrieved_context);
      }
      
      if (data.tool_name) {
        // Check if IDOR was bypassed (Path 1)
        const isIdorBypass = data.tool_name === 'get_private_note' && 
                             (promptText.toLowerCase().includes('note') || promptText.toLowerCase().includes('id'));

        setExecutedTool({
          name: data.tool_name,
          input: data.tool_input,
          output: data.tool_output || '',
          authBypass: isIdorBypass
        });
      }

    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'agent', text: `[SYSTEM ERROR] Failed to compute response: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Summarize Apache Struts CVE-2017-5638", text: "Summarize the CVE-2017-5638 report" },
    { label: "Summarize Heartbleed CVE-2014-0160", text: "Summarize CVE-2014-0160" },
    { label: "Show my private notes", text: "Show my private remediation notes (note id 1)" },
    { label: "Check external advisory URL", text: "Retrieve details from URL http://attacker.example/capture" }
  ];

  return (
    <div className="layout-split" style={{ height: '100%' }}>
      
      {/* Left Column: Traditional Chat Interface */}
      <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
          <Cpu size={16} /> CONVERSATIONAL AGENT CONSOLE
        </div>

        {/* Message logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: m.sender === 'user' ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg-panel)',
              border: '1px solid',
              borderColor: m.sender === 'user' ? 'var(--accent)' : 'var(--border)',
              borderRadius: '4px',
              padding: '0.75rem',
              fontSize: '13px',
              boxShadow: m.sender === 'user' ? '0 0 10px rgba(var(--accent-rgb), 0.05)' : 'none'
            }}>
              <div style={{ 
                fontSize: '10px', 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--text-muted)', 
                marginBottom: '0.25rem',
                textTransform: 'uppercase'
              }}>
                {m.sender === 'user' ? user.username : 'AI AGENT'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', lineHeight: '1.4' }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              [AI THOUGHT PROCESS IN PROGRESS] Generating response...
              <span className="terminal-blink" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggest Prompts */}
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          {quickPrompts.map((p, idx) => (
            <button 
              key={idx} 
              disabled={loading}
              onClick={() => handleSendMessage(p.text)}
              className="cyber-btn"
              style={{ fontSize: '10px', padding: '0.25rem 0.5rem' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <input 
            type="text" 
            disabled={loading}
            className="cyber-input" 
            style={{ flex: 1 }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type query (e.g. 'Can you summarize CVE-2017-5638?')..."
          />
          <button type="submit" disabled={loading} className="cyber-btn cyber-btn-primary" style={{ padding: '0.6rem 1rem' }}>
            <Send size={14} /> SEND
          </button>
        </form>
      </div>

      {/* Right Column: System Context Window (Under the hood) */}
      <div className="cyber-terminal" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="terminal-header">
          <span>⚙️ SYSTEM CONTEXT WINDOW (UNDER THE HOOD)</span>
          <span className="cyber-badge cyber-badge-orange" style={{ fontSize: '9px' }}>DEBUG</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '11px' }}>
          
          {/* System Prompt */}
          <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} /> SYSTEM INSTRUCTIONS
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
              {systemPrompt}
            </div>
          </div>

          {/* RAG Context */}
          <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Database size={12} /> RETRIEVED RAG CONTEXT (VECTOR CHUNKS)
            </div>
            {retrievedContext ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', opacity: 0.9 }}>
                {retrievedContext}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                [NO RAG FETCH TRIGGED FOR CURRENT PROMPT]
              </div>
            )}
          </div>

          {/* Tool Execution Logs */}
          <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} /> EXECUTED TOOL TRACE
            </div>
            {executedTool ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>Tool Call: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{executedTool.name}()</span></div>
                <div>Inputs: 
                  <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '2px', marginTop: '0.25rem' }}>
                    {JSON.stringify(executedTool.input, null, 2)}
                  </pre>
                </div>
                <div>Output: 
                  <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '2px', marginTop: '0.25rem', color: '#10b981' }}>
                    {executedTool.output}
                  </pre>
                </div>

                {theme === 'red' && executedTool.authBypass && (
                  <div style={{ 
                    border: '1px solid var(--danger)', 
                    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                    padding: '0.5rem', 
                    borderRadius: '3px',
                    color: 'var(--danger)',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                      <AlertTriangle size={12} /> [VULNERABILITY EXPLOITED] BROKEN AUTHORIZATION
                    </div>
                    <div>
                      The LLM agent executed tool <strong>get_private_note()</strong> on target note ID without validating if the current session user owns this note record.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                [NO CAPABILITY TOOLS INVOLVED IN RESPONSE GENERATION]
              </div>
            )}
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          * Evaluated LLM system prompt variables to highlight security context boundaries.
        </div>
      </div>

    </div>
  );
}
