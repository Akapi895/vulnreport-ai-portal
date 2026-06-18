import { useContext, useState, useEffect } from 'react';
import { StickyNote, Plus, ShieldAlert, Key, RefreshCw } from 'lucide-react';
import { api, type PrivateNote } from '../api';
import { ThemeContext } from '../App';

export default function PrivateNotes() {
  const { theme } = useContext(ThemeContext);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Note Creation State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  // IDOR POC Exploit State (Red Mode)
  const [pocNoteId, setPocNoteId] = useState('1');
  const [pocResult, setPocResult] = useState<PrivateNote | null>(null);
  const [pocError, setPocError] = useState('');
  const [pocLoading, setPocLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await api.notes.list();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);

    try {
      const newNote = await api.notes.create({ title: noteTitle, note_content: noteContent });
      setNotes([newNote, ...notes]);
      setNoteTitle('');
      setNoteContent('');
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create note');
    }
  };

  const runIdorPoc = async () => {
    setPocError('');
    setPocResult(null);
    setPocLoading(true);

    try {
      const id = parseInt(pocNoteId);
      if (isNaN(id)) {
        throw new Error('Please enter a valid numeric ID.');
      }
      const note = await api.notes.get(id);
      setPocResult(note);
    } catch (err: any) {
      setPocError(err.message || 'Failed to retrieve note. Ownership filter might be active.');
    } finally {
      setPocLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StickyNote size={20} style={{ color: 'var(--accent)' }} /> SECURE REMEDIATION PRIVATE NOTES
        </h2>
        <span className={`cyber-badge ${theme === 'blue' ? 'cyber-badge-blue' : 'cyber-badge-red'}`}>
          {theme === 'blue' ? 'Session Protected' : 'Exploitable'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: theme === 'red' ? '1.2fr 1fr 1fr' : '1.5fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        
        {/* Column 1: List of Notes */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            MY PRIVATE NOTES
          </h3>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '2rem' }}>
                No private notes stored in this session user container.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} style={{ 
                  padding: '0.75rem', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <span>NOTE ID: {n.id}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                    {n.title}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                    {n.note_content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Create Note Form */}
        <div className="cyber-card" style={{ padding: '1rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            CREATE NEW SECURE NOTE
          </h3>

          {createError && (
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', marginBottom: '1rem', fontSize: '12px' }}>
              [ERROR]: {createError}
            </div>
          )}

          {createSuccess && (
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '4px', marginBottom: '1rem', fontSize: '12px' }}>
              [SUCCESS]: Note committed to memory.
            </div>
          )}

          <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NOTE TITLE</label>
              <input 
                type="text" 
                required
                className="cyber-input"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Database Backup Schedule"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NOTE CONTENT</label>
              <textarea 
                required
                rows={5}
                className="cyber-input"
                style={{ resize: 'none', fontFamily: 'var(--font-mono)' }}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write private remediation content here..."
              />
            </div>

            <button type="submit" className="cyber-btn cyber-btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} /> SAVE NOTE
            </button>
          </form>
        </div>

        {/* Column 3: Red Mode IDOR Exploiter POC */}
        {theme === 'red' && (
          <div className="cyber-card" style={{ padding: '1rem', border: '1px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <h3 style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--danger)', borderBottom: '1px solid var(--danger)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} /> DIRECT IDOR EXPLOITER
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Due to Broken Object Level Authorization (IDOR), users can access any private note in the database if they know the numeric ID.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                className="cyber-input" 
                style={{ flex: 1, fontFamily: 'var(--font-mono)', padding: '0.3rem' }} 
                value={pocNoteId} 
                onChange={(e) => setPocNoteId(e.target.value)}
                placeholder="Note ID (e.g. 1)"
              />
              <button 
                onClick={runIdorPoc} 
                disabled={pocLoading}
                className="cyber-btn cyber-btn-danger"
                style={{ fontSize: '10px' }}
              >
                {pocLoading ? <RefreshCw size={10} className="scanlines-anim" /> : <Key size={10} />} EXPLOIT
              </button>
            </div>

            {pocError && (
              <div style={{ 
                padding: '0.5rem', 
                backgroundColor: 'rgba(239,68,68,0.1)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                borderRadius: '3px', 
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                marginBottom: '1rem'
              }}>
                [POC FAILURE]: {pocError}
              </div>
            )}

            {pocResult && (
              <div style={{ 
                border: '1px solid var(--danger)', 
                borderRadius: '4px', 
                padding: '0.75rem', 
                backgroundColor: 'rgba(0,0,0,0.3)',
                fontSize: '11px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', fontWeight: 600, borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                  <span>⚠️ EXFILTRATED NOTE</span>
                  <span>ID: {pocResult.id}</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{pocResult.title}</div>
                <div style={{ opacity: 0.85, color: '#fca5a5', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>{pocResult.note_content}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.25rem' }}>
                  Owner ID: {pocResult.owner_id} (Target IDOR compromised)
                </div>
              </div>
            )}

            {/* Quick Helper hint */}
            {!pocResult && !pocError && (
              <div style={{ 
                fontSize: '10px', 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--text-muted)', 
                backgroundColor: 'rgba(0,0,0,0.15)', 
                padding: '0.5rem', 
                borderRadius: '3px',
                border: '1px dashed var(--border)'
              }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>Lab Target Hint:</div>
                The "Victim User" note is seeded at ID: <strong>1</strong>. Enter "1" and press EXPLOIT to verify direct lateral access bypassing the session owner filter.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
