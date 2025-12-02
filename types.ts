export interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js';
}

export interface Deployment {
  id: string;
  subdomain: string;
  name: string;
  code: string; // Main HTML content (kept for backward compatibility)
  css?: string; // Optional CSS content (kept for backward compatibility)
  js?: string;  // Optional JavaScript content (kept for backward compatibility)
  files?: ProjectFile[]; // New: Array of all project files
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

export interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js';
}

export interface Deployment {
  id: string;
  subdomain: string;
  name: string;
  code: string; // Main HTML content (kept for backward compatibility)
  css?: string; // Optional CSS content (kept for backward compatibility)
  js?: string;  // Optional JavaScript content (kept for backward compatibility)
  files?: ProjectFile[]; // New: Array of all project files
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
  role?: 'admin' | 'user'; // Default: 'user'
}