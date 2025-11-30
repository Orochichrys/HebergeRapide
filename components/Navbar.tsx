import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { CloudLightning, Sun, Moon, Monitor, LogOut, User as UserIcon } from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

type Theme = 'light' | 'dark' | 'system';

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <nav className="border-b border-dark-border bg-dark-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-500 p-2 rounded-lg">
                <CloudLightning className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-200 hidden sm:block">
                {APP_NAME}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation Items */}
            <div className="flex items-baseline space-x-2 mr-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'text-gray-300 hover:bg-dark-border hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-dark-card text-yellow-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Mode Clair"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-dark-card text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Mode Système"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-dark-card text-purple-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Mode Sombre"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-dark-border">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold border border-brand-500/30 group-hover:border-brand-500 transition-colors">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden lg:block">{user.name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;