const API_BASE = '/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  display_name: string;
  created_at: string;
}

export interface Report {
  id: number;
  owner_id: number;
  title: string;
  cve_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  description: string | null;
  content: string;
  source_url: string | null;
  summary: string | null;
  assessment_result: string | null;
  status: 'uploaded' | 'indexed' | 'summarized' | 'assessed';
  rag_indexed: boolean;
  created_at: string;
}

export interface PrivateNote {
  id: number;
  owner_id: number;
  title: string;
  note_content: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  report_id: number | null;
  action: string;
  prompt: string | null;
  retrieved_context: string | null;
  tool_name: string | null;
  tool_input: any | null;
  tool_output: string | null;
  response: string | null;
  created_at: string;
}

export interface LabStatus {
  lab_mode: boolean;
  vuln_flags: {
    note_idor: boolean;
    fetch_header_forward: boolean;
    mcp_secret_leak: boolean;
    rag_poisoning: boolean;
  };
  users: number;
  reports: number;
  internal_assets: number;
}

export interface AiResponse {
  response: string;
  retrieved_context: string | null;
  tool_name: string | null;
  tool_input: any | null;
  tool_output: string | null;
}

async function request<T>(path: string, options: Omit<RequestInit, 'body'> & { body?: any } = {}): Promise<T> {
  options.credentials = 'include';
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, options as RequestInit);
  
  if (!response.ok) {
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      errMsg = data.detail || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    register: (payload: any) => request<User>('/auth/register', { method: 'POST', body: payload }),
    login: (payload: any) => request<User>('/auth/login', { method: 'POST', body: payload }),
    logout: () => request<{ status: string }>('/auth/logout', { method: 'POST' }),
    me: () => request<User>('/auth/me', { method: 'GET' }),
  },
  reports: {
    list: () => request<Report[]>('/reports', { method: 'GET' }),
    get: (id: number) => request<Report>(`/reports/${id}`, { method: 'GET' }),
    upload: (payload: any) => request<Report>('/reports', { method: 'POST', body: payload }),
    uploadFile: (formData: FormData) => request<Report>('/reports/upload-file', { method: 'POST', body: formData }),
    summarize: (id: number) => request<Report>(`/reports/${id}/summarize`, { method: 'POST' }),
    assessImpact: (id: number, serviceName: string | null) => request<Report>(`/reports/${id}/assess-impact`, { method: 'POST', body: { service_name: serviceName } }),
    delete: (id: number) => request<{ status: string }>(`/reports/${id}`, { method: 'DELETE' }),
  },
  notes: {
    list: () => request<PrivateNote[]>('/notes', { method: 'GET' }),
    get: (id: number) => request<PrivateNote>(`/notes/${id}`, { method: 'GET' }),
    create: (payload: { title: string; note_content: string }) => request<PrivateNote>('/notes', { method: 'POST', body: payload }),
  },
  ai: {
    chat: (prompt: string) => request<AiResponse>('/ai/chat', { method: 'POST', body: { prompt } }),
    summarizeCve: (cveId: string, prompt: string) => request<AiResponse>('/ai/summarize-cve', { method: 'POST', body: { cve_id: cveId, prompt } }),
  },
  admin: {
    getUsers: () => request<User[]>('/admin/users', { method: 'GET' }),
    getReports: () => request<Report[]>('/admin/reports', { method: 'GET' }),
    getAuditLogs: () => request<AuditLog[]>('/admin/audit-logs', { method: 'GET' }),
    getStatus: () => request<LabStatus>('/admin/status', { method: 'GET' }),
    getFlag: () => request<{ flag: string }>('/admin/flag', { method: 'GET' }),
  }
};
