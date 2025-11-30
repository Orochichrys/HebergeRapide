export interface Deployment {
  id: string;
  subdomain: string;
  name: string;
  code: string; // Storing HTML directly for this demo
  createdAt: number;
  status: 'live' | 'building' | 'error';
  url: string;
  visitors: number;
}

export interface ApiKey {
  key: string;
  name: string;
  createdAt: number;
  lastUsed?: number;
}

export type CodeAnalysis = {
  score: number;
  suggestions: string[];
  optimizedCode?: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
}