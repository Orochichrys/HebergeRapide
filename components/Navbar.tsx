import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CloudLightning } from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '../constants';

const Navbar: React.FC = () => {
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
            <div className="flex items-baseline space-x-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;