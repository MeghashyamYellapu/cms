import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Sync main content margin via CSS variable
  useEffect(() => {
    const updateMargin = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.setProperty('--sidebar-width', isOpen ? '256px' : '80px');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      }
    };
    updateMargin();
    window.addEventListener('resize', updateMargin);
    return () => window.removeEventListener('resize', updateMargin);
  }, [isOpen]);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) setIsOpen(false);
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSuperOrWebsiteAdmin = ['SuperAdmin', 'WebsiteAdmin'].includes(admin?.role);
  const isAgent = admin?.role === 'Agent';

  const menuItems = isSuperOrWebsiteAdmin
    ? [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admins',    icon: Shield,          label: 'Admins'    },
        { path: '/settings',  icon: Settings,        label: 'Settings'  },
      ]
    : isAgent
    ? [
        { path: '/customers', icon: Users,     label: 'Customers' },
        { path: '/payments',  icon: CreditCard, label: 'Payments'  },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/customers', icon: Users,           label: 'Customers' },
        { path: '/bills',     icon: FileText,        label: 'Bills'     },
        { path: '/payments',  icon: CreditCard,      label: 'Payments'  },
        { path: '/reports',   icon: BarChart3,       label: 'Reports'   },
        { path: '/admins',    icon: Shield,          label: 'My Agents' },
        { path: '/settings',  icon: Settings,        label: 'Settings'  },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          <span className="font-bold text-gray-800 dark:text-white text-sm">Cable Billing</span>
        </div>

        {/* Theme toggle (mobile) */}
        <button
          onClick={toggleTheme}
          className="ml-auto p-2 rounded-lg text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <User size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{admin?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{admin?.role}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
          isOpen ? 'w-64 translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-gray-100 dark:border-slate-700 flex items-center min-h-[64px] ${isOpen ? 'p-4 gap-3' : 'p-3 justify-center'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
            <span className="text-white text-sm font-bold">CB</span>
          </div>
          {isOpen && (
            <div className="overflow-hidden flex-1">
              <h1 className="font-bold text-gray-900 dark:text-white text-base leading-tight">Cable Billing</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">Management System</p>
            </div>
          )}
        </div>

        {/* Desktop collapse/expand tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex absolute -right-3 top-[52px] w-6 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-r-lg items-center justify-center shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 text-gray-400 dark:text-slate-400 transition-all duration-200 z-50"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                } ${!isOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title={!isOpen ? item.label : ''}
              >
                <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  <Icon size={20} />
                </div>
                {isOpen && <span className="text-sm truncate">{item.label}</span>}
                {isOpen && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme toggle + user + logout */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-700 space-y-1">
          {/* Theme toggle (desktop) */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white ${
              !isOpen ? 'lg:justify-center' : ''
            }`}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark
              ? <Sun size={18} className="flex-shrink-0 text-amber-400" />
              : <Moon size={18} className="flex-shrink-0" />
            }
            {isOpen && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User card */}
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-slate-800 ${!isOpen ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{admin?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{admin?.role}</p>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-sm font-medium ${
              !isOpen ? 'lg:justify-center' : ''
            }`}
            title={!isOpen ? 'Sign Out' : ''}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
