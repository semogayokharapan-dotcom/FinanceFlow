import { apiRequest } from "./queryClient";
import type { LoginRequest, RegisterRequest, User } from "@shared/schema";

export interface AuthUser {
  id: string;
  fullName: string;
  monthlyTarget: string;
  weyId: string;
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  return data.user;
}

export async function register(userData: RegisterRequest): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  const data = await response.json();
  return data.user;
}

export function savePrivateKey(privateKey: string): void {
  localStorage.setItem('userPrivateKey', privateKey);
}

export function getStoredPrivateKey(): string | null {
  return localStorage.getItem('userPrivateKey');
}

export function clearStoredPrivateKey(): void {
  localStorage.removeItem('userPrivateKey');
}

export function saveUserData(user: AuthUser): void {
  localStorage.setItem('userData', JSON.stringify(user));
}

export function getStoredUserData(): AuthUser | null {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
}

export function clearUserData(): void {
  localStorage.removeItem('userData');
}
