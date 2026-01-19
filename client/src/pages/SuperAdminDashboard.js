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

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="card flex items-center p-6 transition-transform hover:scale-105">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-6 ${color}`}>
        <Icon size={32} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of system administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Admins" 
          value={stats.totalAdmins} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Admins" 
          value={stats.activeAdmins} 
          icon={CheckCircle} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Super Admins" 
          value={stats.superAdmins} 
          icon={Shield} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Website Admins" 
          value={stats.websiteAdmins} 
          icon={Shield} 
          color="bg-yellow-500" 
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = '/admins'}>
                <h3 className="font-semibold text-blue-600">Manage Admins</h3>
                <p className="text-sm text-gray-500">Create, edit, or remove admin accounts.</p>
             </div>
             <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = '/settings'}>
                <h3 className="font-semibold text-blue-600">System Settings</h3>
                <p className="text-sm text-gray-500">Update company information and profile.</p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
