import { signal } from '@angular/core';

const API_BASE_URL = 'http://localhost:5098';

export interface User {
  id: string;
  name: string;
  email: string;
}

const STORAGE_KEY = 'studywise.currentUser';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user: User | null): void {
  currentUser.set(user);
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const currentUser = signal<User | null>(readStoredUser());

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

async function authRequest(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
}

async function getSessionInfo(): Promise<Response> {
  return fetch(`${API_BASE_URL}/manage/info`, {
    method: 'GET',
    credentials: 'include',
  });
}

function userFromEmail(email: string, name?: string): User {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    id: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0],
    email: normalizedEmail,
  };
}

export async function refreshCurrentUser(): Promise<User | null> {
  const response = await getSessionInfo();

  if (!response.ok) {
    setCurrentUser(null);
    return null;
  }

  const info = (await response.json()) as { email?: string };
  const email = info.email?.trim();
  if (!email) {
    setCurrentUser(null);
    return null;
  }

  const stored = readStoredUser();
  const user = userFromEmail(email, stored?.email.toLowerCase() === email.toLowerCase() ? stored.name : undefined);
  setCurrentUser(user);
  return user;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await authRequest('/login?useCookies=true', {
    email: normalizedEmail,
    password,
  });

  if (!response.ok) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  const user = userFromEmail(normalizedEmail);
  setCurrentUser(user);
  return { ok: true, user };
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await authRequest('/register', {
    email: normalizedEmail,
    password,
  });

  if (!response.ok) {
    return { ok: false, error: 'An account with that email may already exist, or the password is too weak.' };
  }

  const loginResult = await login(normalizedEmail, password);
  const user = userFromEmail(normalizedEmail, name);
  setCurrentUser(user);
  return loginResult.ok ? { ok: true, user } : loginResult;
}

export async function logout(): Promise<void> {
  setCurrentUser(null);

  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Logout failed.');
  }
}

export function firstNameOf(user: User): string {
  return user.name.trim().split(/\s+/)[0] ?? user.name;
}

export function initialOf(user: User): string {
  return firstNameOf(user).charAt(0).toUpperCase();
}
