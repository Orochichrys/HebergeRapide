import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { CloudLightning, Sun, Moon, Monitor, LogOut, Settings, ChevronDown } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
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
                      : 'text-gray-300 hover:bg-border hover:text-foreground'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative pl-4 border-l border-border" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold border border-brand-500/30 group-hover:border-brand-500 transition-colors">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden lg:block text-foreground">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border bg-background/50">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>

                    {/* Theme Selector */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Thème</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'light'
                              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                              : 'bg-background text-muted-foreground hover:text-foreground hover:bg-border'
                            }`}
                        >
                          <Sun className="w-4 h-4" />
                          <span className="text-xs">Clair</span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'system'
                              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                              : 'bg-background text-muted-foreground hover:text-foreground hover:bg-border'
                            }`}
                        >
                          <Monitor className="w-4 h-4" />
                          <span className="text-xs">Auto</span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'dark'
                              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                              : 'bg-background text-muted-foreground hover:text-foreground hover:bg-border'
                            }`}
                        >
                          <Moon className="w-4 h-4" />
                          <span className="text-xs">Sombre</span>
                        </button>
                      </div>
                    </div>

                    {/* Menu Items */}
                     <div className="py-1">
                      {/* Admin Dashboard Link - Only for admins */}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brand-400 hover:bg-brand-500/10 transition-colors font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-background transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Paramètres
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border">
                      <button
                        onClick={() => {
                          onLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;