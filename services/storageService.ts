import { Deployment, ApiKey, User } from '../types';

const DEPLOYMENTS_KEY = 'hr_deployments';
const API_KEYS_KEY = 'hr_api_keys';
const USERS_KEY = 'hr_users';

// --- Deployments ---

export const getDeployments = (): Deployment[] => {
  const data = localStorage.getItem(DEPLOYMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const isSubdomainTaken = (subdomain: string): boolean => {
  const deployments = getDeployments();
  return deployments.some(d => d.subdomain.toLowerCase() === subdomain.toLowerCase());
};

export const saveDeployment = (deployment: Deployment): void => {
  const data = localStorage.getItem(DEPLOYMENTS_KEY);
  const all: Deployment[] = data ? JSON.parse(data) : [];
  const updated = [deployment, ...all];
  localStorage.setItem(DEPLOYMENTS_KEY, JSON.stringify(updated));
};

export const deleteDeployment = (id: string): void => {
  const data = localStorage.getItem(DEPLOYMENTS_KEY);
  const all: Deployment[] = data ? JSON.parse(data) : [];
  const updated = all.filter(d => d.id !== id);
  localStorage.setItem(DEPLOYMENTS_KEY, JSON.stringify(updated));
};

// --- API Keys ---

export const getApiKeys = (): ApiKey[] => {
  const data = localStorage.getItem(API_KEYS_KEY);
  return data ? JSON.parse(data) : [];
};

export const generateApiKey = (name: string): ApiKey => {
  const newKey: ApiKey = {
    key: `hr_live_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
    name,
    createdAt: Date.now()
  };
  const data = localStorage.getItem(API_KEYS_KEY);
  const all: ApiKey[] = data ? JSON.parse(data) : [];
  localStorage.setItem(API_KEYS_KEY, JSON.stringify([...all, newKey]));
  return newKey;
};

// --- Auth ---

export const registerUser = (name: string, email: string, password: string): User => {
  const data = localStorage.getItem(USERS_KEY);
  const users = data ? JSON.parse(data) : [];
  
  if (users.find((u: any) => u.email === email)) {
    throw new Error('Cet email est déjà utilisé.');
  }

  const newUser = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    email,
    password, // Stored in plain text for demo only
    createdAt: Date.now()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Return user without password
  const { password: _, ...user } = newUser;
  return user;
};

export const loginUser = (email: string, password: string): User => {
  const data = localStorage.getItem(USERS_KEY);
  const users = data ? JSON.parse(data) : [];
  
  const user = users.find((u: any) => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};