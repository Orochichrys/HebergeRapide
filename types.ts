export interface Deployment {
  id: string;
  subdomain: string;
  name: string;
  code: string; // HTML content
  css?: string; // Optional CSS content
  js?: string;  // Optional JavaScript content
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