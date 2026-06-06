// Frontend API client for the treasure game backend.
// Calls relative /api/* paths (proxied to the Node server by Vite in dev).

const TOKEN_KEY = 'treasure_token';

export interface AuthResult {
  token: string;
  username: string;
  highScore: number;
}

// Reads the stored JWT. Input: none. Output: token string or null.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Persists the JWT. Input: token (string). Output: none.
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Clears the stored JWT. Input: none. Output: none.
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Internal helper: performs a fetch and throws the server error message on failure.
// Input: path (string), options (RequestInit). Output: Promise<parsed JSON>.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// Registers a new account. Input: username, password. Output: Promise<AuthResult>.
export function signup(username: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Logs in an existing account. Input: username, password. Output: Promise<AuthResult>.
export function login(username: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Fetches the current user's profile using the stored token.
// Input: none. Output: Promise<{ username, highScore }>.
export function getMe(): Promise<{ username: string; highScore: number }> {
  return request('/api/me');
}

// Submits a finished game's score; backend keeps only the highest.
// Input: score (number). Output: Promise<{ highScore }>.
export function submitScore(score: number): Promise<{ highScore: number }> {
  return request('/api/score', {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}
