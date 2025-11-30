import { Box, Globe, Terminal, Cpu } from "lucide-react";

export const APP_NAME = "HébergeRapide";
export const DEMO_DELAY = 1500;

export const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/', icon: Box },
  { label: 'Déployer', path: '/deploy', icon: Globe },
  { label: 'API & Développeurs', path: '/api-docs', icon: Terminal },
];
