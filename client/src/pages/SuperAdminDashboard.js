import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Shield, CheckCircle } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    websiteAdmins: 0,
    superAdmins: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getAll();
      const admins = response.data.data;
      
      setStats({
        totalAdmins: admins.length,
        activeAdmins: admins.filter(a => a.status === 'Active').length,
        websiteAdmins: admins.filter(a => a.role === 'WebsiteAdmin').length,
        superAdmins: admins.filter(a => a.role === 'SuperAdmin').length
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, shadow }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${gradient} text-white shadow-xl ${shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon size={20} className="text-white" />
          </div>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        </div>
        <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Overview of system administration</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Admins"
          value={stats.totalAdmins}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          shadow="shadow-blue-200"
        />
        <StatCard
          title="Active Admins"
          value={stats.activeAdmins}
          icon={CheckCircle}
          gradient="from-emerald-500 to-teal-500"
          shadow="shadow-emerald-200"
        />
        <StatCard
          title="Super Admins"
          value={stats.superAdmins}
          icon={Shield}
          gradient="from-indigo-500 to-purple-600"
          shadow="shadow-indigo-200"
        />
        <StatCard
          title="Website Admins"
          value={stats.websiteAdmins}
          icon={Shield}
          gradient="from-amber-500 to-orange-500"
          shadow="shadow-amber-200"
        />
      </div>

      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="p-4 sm:p-5 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all group"
            onClick={() => window.location.href = '/admins'}
          >
            <h3 className="font-semibold text-indigo-600 mb-1 group-hover:text-indigo-700">Manage Admins</h3>
            <p className="text-sm text-gray-500">Create, edit, or remove admin accounts.</p>
          </div>
          <div
            className="p-4 sm:p-5 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all group"
            onClick={() => window.location.href = '/settings'}
          >
            <h3 className="font-semibold text-indigo-600 mb-1 group-hover:text-indigo-700">System Settings</h3>
            <p className="text-sm text-gray-500">Update company information and profile.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
