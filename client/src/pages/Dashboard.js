import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerAPI, billAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertOctagon,
  Activity,
  PlusCircle,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customers: null,
    bills: null,
    payments: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [customersRes, billsRes, paymentsRes] = await Promise.all([
        customerAPI.getStats(),
        billAPI.getStats(),
        paymentAPI.getStats(),
      ]);

      setStats({
        customers: customersRes.data.data,
        bills: billsRes.data.data,
        payments: paymentsRes.data.data,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.payments?.totalAmount || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-200',
    },
    {
      title: 'Total Customers',
      value: stats.customers?.totalCustomers || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-200',
    },
    {
      title: 'Active Users',
      value: stats.customers?.activeCustomers || 0,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-200',
    },
    {
      title: 'Pending Bills',
      value: `₹${(stats.bills?.totalPending || 0).toLocaleString('en-IN')}`,
      icon: AlertOctagon,
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-200',
    },
  ];

  const secondaryStats = [
    { label: 'Paid Bills', value: stats.bills?.paidBills, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Unpaid Bills', value: stats.bills?.unpaidBills, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Partial Paid', value: stats.bills?.partialBills, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Inactive', value: stats.customers?.inactiveCustomers, icon: UserX, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  // Charts Config
  const serviceTypeData = stats.customers?.serviceTypeStats?.map(item => ({
    name: item._id,
    value: item.count,
  })) || [];
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']; // Indigo, Emerald, Amber, Red

  const dailyCollections = stats.payments?.dailyCollections?.reverse().slice(0, 7) || [];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-8 md:py-10 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
              Dashboard
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Welcome back, <span className="font-semibold text-gray-800">{admin?.name}</span>! Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => navigate('/payments')} 
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105"
             >
                <PlusCircle size={20} />
                <span>New Payment</span>
             </button>
             <button 
                onClick={() => navigate('/bills')} 
                className="btn bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 flex items-center gap-2 px-6 py-3 rounded-xl transition-all"
             >
                <FileText size={20} />
                <span>Manage Bills</span>
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-8">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${stat.gradient} text-white shadow-xl ${stat.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Icon size={24} className="text-white" />
                        </div>
                        {/* Decorative Circle */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                    <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Stats & Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed Breakdown */}
          <div className="lg:col-span-1 space-y-6">
              {/* Secondary Grid */}
              <div className="grid grid-cols-2 gap-4">
                  {secondaryStats.map((stat, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                              <stat.icon size={20} />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-800 mb-1">{stat.value || 0}</h4>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                      </div>
                  ))}
              </div>

              {/* Quick Areas */}
              {stats.customers?.areaStats && stats.customers.areaStats.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-500" /> Top Areas
                    </h3>
                    <div className="space-y-4">
                        {stats.customers.areaStats.slice(0, 3).map((area, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <span className="text-gray-600 font-medium group-hover:text-indigo-600 transition-colors">{area._id}</span>
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">{area.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}
          </div>

          {/* Charts Area */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Revenue Trend (Last 7 Days)</h3>
                      <span className="text-sm text-green-500 font-medium bg-green-50 px-3 py-1 rounded-full">
                          + Live Updates
                      </span>
                  </div>
                  {dailyCollections.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyCollections}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                            <XAxis 
                                dataKey="_id" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}} 
                                tickFormatter={(value) => `₹${value/1000}k`} 
                            />
                            <Tooltip 
                                cursor={{fill: '#f3f4f6'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar 
                                dataKey="amount" 
                                fill="url(#colorGradient)" 
                                radius={[6, 6, 0, 0]} 
                                barSize={40}
                            />
                            <defs>
                              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.5} />
                              </linearGradient>
                            </defs>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
                        No revenue data available
                    </div>
                  )}
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service Types */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Service Distribution</h3>
                      <div className="h-[200px]">
                          {serviceTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={serviceTypeData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {serviceTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No data</div>
                          )}
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                          {serviceTypeData.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                                  <span className="text-xs text-gray-600 font-medium">{item.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Quick Tip or Promo */}
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                            <p className="text-indigo-200 text-sm mb-4">
                                Check out the documentation or contact support if you need assistance managing billing.
                            </p>
                            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                View Documentation
                            </button>
                        </div>
                        {/* Decorative */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
                  </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
