import React, { createContext, useState, useEffect } from 'react';
import { Shield, Terminal as TerminalIcon, LogOut, LayoutDashboard, FileText, MessageSquare, StickyNote, ShieldAlert, User as UserIcon } from 'lucide-react';
import { api, type User } from './api';
import Dashboard from './pages/Dashboard';
import ReportManagement from './pages/ReportManagement';
import AIChat from './pages/AIChat';
import PrivateNotes from './pages/PrivateNotes';
import AdminPortal from './pages/AdminPortal';

const TAB_TO_PATH: Record<string, string> = {
  dashboard: '/',
  reports: '/reports',
  chat: '/chat',
  notes: '/notes',
  admin: '/admin',
};

const PATH_TO_TAB: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/reports': 'reports',
  '/chat': 'chat',
  '/notes': 'notes',
  '/admin': 'admin',
};

const THEME_STORAGE_KEY = 'vulnreport.theme';

function tabFromPath(pathname: string): string {
  return PATH_TO_TAB[pathname] || 'dashboard';
}

interface ThemeContextType {
  theme: 'blue' | 'red';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  toggleTheme: () => {},
});

export default function App() {
  const [theme, setTheme] = useState<'blue' | 'red'>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'red' ? 'red' : 'blue';
  });
  const [glitchActive, setGlitchActive] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = localStorage.getItem('vulnreport.activeTab');
    return savedTab || tabFromPath(window.location.pathname);
  });
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    checkUserSession();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('theme-red', theme === 'red');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('vulnreport.activeTab', activeTab);
    if (user && activeTab === 'admin' && user.role !== 'admin') {
      navigateToTab('dashboard', true);
    }
  }, [activeTab, user]);

  const checkUserSession = async () => {
    setAuthLoading(true);
    try {
      const data = await api.auth.me();
      setUser(data);
    } catch (_) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.auth.login({ username: authUsername, password: authPassword });
      setUser(data);
      setAuthUsername('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.auth.register({
        username: authUsername,
        email: authEmail,
        password: authPassword,
        display_name: authDisplayName || authUsername
      });
      setUser(data);
      setAuthUsername('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    if (user) {
      sessionStorage.removeItem(`vulnreport.chat.${user.id}`);
      sessionStorage.removeItem(`vulnreport.chat_context.${user.id}`);
      sessionStorage.removeItem(`vulnreport.chat_tool.${user.id}`);
    }
    localStorage.removeItem('vulnreport.activeTab');
    setUser(null);
    navigateToTab('dashboard', true);
  };

  const navigateToTab = (tab: string, replace = false) => {
    const nextPath = TAB_TO_PATH[tab] || '/';
    if (window.location.pathname !== nextPath) {
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', nextPath);
    }
    setActiveTab(tab);
  };

  const toggleTheme = () => {
    setGlitchActive(true);
    const newTheme = theme === 'blue' ? 'red' : 'blue';
    setTheme(newTheme);

    setTimeout(() => {
      setGlitchActive(false);
    }, 400);
  };

  if (authLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--bg-base)' }}>
        <div className="crt-effect" />
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
          [SYSTEM INITIALIZING] Loading session data...
          <span className="terminal-blink" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowY: 'auto' }}>
        <div className="crt-effect" />
        
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {theme === 'blue' ? (
              <Shield size={24} style={{ color: 'var(--accent)' }} />
            ) : (
              <TerminalIcon size={24} style={{ color: 'var(--accent)' }} />
            )}
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
              VULNREPORT <span style={{ color: 'var(--accent)' }}>AI PORTAL</span>
            </span>
            <span className={`cyber-badge ${theme === 'blue' ? 'cyber-badge-blue' : 'cyber-badge-red'}`} style={{ marginLeft: '0.5rem' }}>
              {theme === 'blue' ? 'Analyst Mode' : 'Attacker Mode'}
            </span>
          </div>

          <button onClick={toggleTheme} className="cyber-btn" style={{ borderColor: 'var(--accent)' }}>
            {theme === 'blue' ? <TerminalIcon size={16} /> : <Shield size={16} />}
            SWITCH MODE
          </button>
        </header>

        <main className={glitchActive ? 'glitch-active' : ''} style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}>
          <div className="cyber-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontSize: '24px' }}>
              {isRegistering ? 'INITIALIZE CREDENTIALS' : 'ACCESS PORTAL'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '13px' }}>
              {isRegistering 
                ? 'Create a reporter profile to upload CVE advisories.' 
                : 'Authentication required to upload, edit, or evaluate reports.'}
            </p>

            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)'
              }}>
                [ERROR]: {authError}
              </div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>USERNAME</label>
                <input
                  type="text"
                  required
                  className="cyber-input"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="e.g. analyst_john"
                />
              </div>

              {isRegistering && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      className="cyber-input"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. john@vulnreport.local"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DISPLAY NAME (OPTIONAL)</label>
                    <input
                      type="text"
                      className="cyber-input"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SECRET KEY / PASSWORD</label>
                <input
                  type="password"
                  required
                  className="cyber-input"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              <button type="submit" className="cyber-btn cyber-btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                {isRegistering ? 'CREATE ACCOUNT' : 'ESTABLISH LINK'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegistering ? 'Already registered? ' : 'First time? '}
              </span>
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                }} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {isRegistering ? 'Sign In' : 'Create Profile'}
              </button>
            </div>
            
            <div style={{ 
              marginTop: '2rem', 
              padding: '0.75rem', 
              border: '1px dashed var(--border)', 
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}>
              <div style={{ color: 'var(--accent)', marginBottom: '0.25rem', fontWeight: 600 }}>DEMO CREDENTIALS:</div>
              <div>Attacker: <span style={{ color: 'var(--text-main)' }}>attacker / attacker123</span></div>
              <div>Victim: <span style={{ color: 'var(--text-main)' }}>victim / victim123</span></div>
              {/* <div>Admin: <span style={{ color: 'var(--text-main)' }}>admin / admin123</span></div> */}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-container">
        <div className="crt-effect" />

        <header style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {theme === 'blue' ? (
              <Shield size={22} style={{ color: 'var(--accent)' }} />
            ) : (
              <TerminalIcon size={22} style={{ color: 'var(--accent)' }} />
            )}
            <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              VULNREPORT <span style={{ color: 'var(--accent)' }}>AI PORTAL</span>
            </span>
            <span className={`cyber-badge ${theme === 'blue' ? 'cyber-badge-blue' : 'cyber-badge-red'}`}>
              {theme === 'blue' ? 'Analyst Mode' : 'Attacker Mode'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <nav style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={() => navigateToTab('dashboard')} 
                className={`cyber-btn ${activeTab === 'dashboard' ? 'cyber-btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '0.4rem 0.8rem' }}
              >
                <LayoutDashboard size={14} /> DASHBOARD
              </button>
              <button 
                onClick={() => navigateToTab('reports')} 
                className={`cyber-btn ${activeTab === 'reports' ? 'cyber-btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '0.4rem 0.8rem' }}
              >
                <FileText size={14} /> REPORTS
              </button>
              <button 
                onClick={() => navigateToTab('chat')} 
                className={`cyber-btn ${activeTab === 'chat' ? 'cyber-btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '0.4rem 0.8rem' }}
              >
                <MessageSquare size={14} /> AI CHAT
              </button>
              <button 
                onClick={() => navigateToTab('notes')} 
                className={`cyber-btn ${activeTab === 'notes' ? 'cyber-btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '0.4rem 0.8rem' }}
              >
                <StickyNote size={14} /> PRIVATE NOTES
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigateToTab('admin')} 
                  className={`cyber-btn ${activeTab === 'admin' ? 'cyber-btn-primary' : ''}`}
                  style={{ fontSize: '11px', padding: '0.4rem 0.8rem', borderColor: 'var(--warning)', color: activeTab === 'admin' ? '#fff' : 'var(--warning)' }}
                >
                  <ShieldAlert size={14} /> ADMIN
                </button>
              )}
            </nav>

            <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserIcon size={12} style={{ color: 'var(--accent)' }} /> {user.display_name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  role: {user.role}
                </div>
              </div>
              
              <button onClick={toggleTheme} className="cyber-btn" style={{ padding: '0.4rem' }}>
                {theme === 'blue' ? <TerminalIcon size={14} /> : <Shield size={14} />}
              </button>

              <button 
                onClick={handleLogout} 
                className="cyber-btn cyber-btn-danger" 
                style={{ padding: '0.4rem 0.6rem' }} 
                title="Disconnect Link"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        <main 
          className={glitchActive ? 'glitch-active' : ''} 
          style={{
            flex: 1,
            overflow: 'hidden',
            padding: '1.25rem',
            position: 'relative',
          }}
        >
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'reports' && <ReportManagement user={user} />}
          {activeTab === 'chat' && <AIChat user={user} />}
          {activeTab === 'notes' && <PrivateNotes />}
          {activeTab === 'admin' && user.role === 'admin' && <AdminPortal />}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
