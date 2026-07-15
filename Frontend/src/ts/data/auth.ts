import { signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends User {
  password: string;
}

let idCounter = 100;
function nextId(): string {
  idCounter += 1;
  return `user-${idCounter}`;
}

const users: StoredUser[] = [
  { id: 'user-1', name: 'Demo Student', email: 'demo@studywise.com', password: 'password123' },
];

export const currentUser = signal<User | null>(null);

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

export function login(email: string, password: string): AuthResult {
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found || found.password !== password) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  const user: User = { id: found.id, name: found.name, email: found.email };
  currentUser.set(user);
  return { ok: true, user };
}

export function register(name: string, email: string, password: string): AuthResult {
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { ok: false, error: 'An account with that email already exists.' };
  }

  const stored: StoredUser = { id: nextId(), name: name.trim(), email: email.trim(), password };
  users.push(stored);

  const user: User = { id: stored.id, name: stored.name, email: stored.email };
  currentUser.set(user);
  return { ok: true, user };
}

export function logout(): void {
  currentUser.set(null);
}

export function firstNameOf(user: User): string {
  return user.name.trim().split(/\s+/)[0] ?? user.name;
}

export function initialOf(user: User): string {
  return firstNameOf(user).charAt(0).toUpperCase();
}