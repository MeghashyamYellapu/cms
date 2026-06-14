import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
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

  // Define menu items based on role
  const isSuperOrWebsiteAdmin = ['SuperAdmin', 'WebsiteAdmin'].includes(admin?.role);
  const isAgent = admin?.role === 'Agent';

  const menuItems = isSuperOrWebsiteAdmin
    ? [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admins', icon: Shield, label: 'Admins' },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ]
    : isAgent
    ? [
        { path: '/customers', icon: Users, label: 'Customers' },
        { path: '/payments', icon: CreditCard, label: 'Payments' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/customers', icon: Users, label: 'Customers' },
        { path: '/bills', icon: FileText, label: 'Bills' },
        { path: '/payments', icon: CreditCard, label: 'Payments' },
        { path: '/reports', icon: BarChart3, label: 'Reports' },
        { path: '/admins', icon: Shield, label: 'My Agents' },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          <span className="font-bold text-gray-800 text-sm">Cable Billing</span>
        </div>

        {/* User menu — right side of mobile top bar */}
        <div className="ml-auto relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={15} className="text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate hidden xs:block">
              {admin?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{admin?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{admin?.role}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col ${
          isOpen ? 'w-64 translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 min-h-[72px]">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
            <span className="text-white text-sm font-bold">CB</span>
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-gray-900 text-base leading-tight">Cable Billing</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          )}
        </div>

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
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                } ${!isOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title={!isOpen ? item.label : ''}
              >
                <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  <Icon size={20} />
                </div>
                {isOpen && <span className="text-sm truncate">{item.label}</span>}
                {isOpen && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {/* User card */}
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-gray-50 ${!isOpen ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-indigo-600" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{admin?.name}</p>
                <p className="text-xs text-gray-400 truncate">{admin?.role}</p>
              </div>
            )}
          </div>

          {/* Sign out — always visible */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all text-sm font-medium ${
              !isOpen ? 'lg:justify-center' : ''
            }`}
            title={!isOpen ? 'Sign Out' : ''}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
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
