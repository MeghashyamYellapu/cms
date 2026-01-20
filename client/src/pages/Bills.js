import React, { useState, useEffect } from 'react';
import { billAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Calendar, ChevronDown, ChevronUp, User, X, Search, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Mobile view state
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getAll({ limit: 50 });
      setBills(response.data.data);
    } catch (error) {
      console.error('Fetch bills error:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      const response = await billAPI.generate({
        month: selectedMonth,
        year: selectedYear
      });
      toast.success(response.data.message);
      setShowGenerateModal(false);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate bills');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Partial': return 'badge-warning';
      case 'Unpaid': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter bills based on search and status
  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchFilter || 
      bill.customerId?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      bill.customerId?.customerId?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      bill.customerId?.phoneNumber?.includes(searchFilter);
    
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const stats = {
    total: filteredBills.length,
    paid: filteredBills.filter(b => b.status === 'Paid').length,
    partial: filteredBills.filter(b => b.status === 'Partial').length,
    unpaid: filteredBills.filter(b => b.status === 'Unpaid').length,
    totalAmount: filteredBills.reduce((sum, b) => sum + (b.totalPayable || 0), 0),
    collectedAmount: filteredBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage monthly billing</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span className="text-sm sm:text-base">Generate Bills</span>
        </button>
      </div>

      {/* Summary Cards */}
      {bills.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Bills</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
            <p className="text-xs text-green-600 uppercase tracking-wide">Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.collectedAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
            <p className="text-xs text-red-600 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-red-600 mt-1">₹{(stats.totalAmount - stats.collectedAmount).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, ID..."
              className="input pl-10"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <select
            className="input sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Paid">✅ Paid</option>
            <option value="Partial">🟡 Partial</option>
            <option value="Unpaid">❌ Unpaid</option>
          </select>
        </div>
      </div>

      {/* Bills List */}
      <div className="card p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading h-8 w-8"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
            <FileText size={48} className="mb-4" />
            <p className="text-lg">No bills generated yet</p>
            <p className="text-sm text-center">Click "Generate Bills" to create monthly bills for all active customers</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
            <Search size={48} className="mb-4" />
            <p className="text-lg">No bills match your search</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filteredBills.map((bill) => (
                <div key={bill._id} className="bg-white">
                  {/* Card Header - Always visible */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedBillId(expandedBillId === bill._id ? null : bill._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{bill.customerId?.name}</p>
                        <p className="text-xs text-gray-500">{bill.customerId?.customerId}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{bill.month} {bill.year}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-gray-900">₹{bill.totalPayable}</p>
                        </div>
                        {expandedBillId === bill._id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedBillId === bill._id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Package Amount</p>
                          <p className="font-semibold text-gray-900">₹{bill.packageAmount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Previous Balance</p>
                          <p className={`font-semibold ${bill.previousBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            ₹{bill.previousBalance}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Paid Amount</p>
                          <p className="font-semibold text-green-600">₹{bill.paidAmount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Remaining</p>
                          <p className={`font-semibold ${bill.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{bill.remainingBalance}
                          </p>
                        </div>
                      </div>
                      {bill.customerId?.phoneNumber && (
                        <p className="text-xs text-gray-500 mt-3 text-center">
                          📞 {bill.customerId.phoneNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="table min-w-full">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Period</th>
                    <th>Package</th>
                    <th>Previous Balance</th>
                    <th>Total Payable</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill._id}>
                      <td>
                        <div>
                          <p className="font-medium">{bill.customerId?.name}</p>
                          <p className="text-sm text-gray-500">{bill.customerId?.customerId}</p>
                        </div>
                      </td>
                      <td>{bill.month} {bill.year}</td>
                      <td>₹{bill.packageAmount}</td>
                      <td className={bill.previousBalance > 0 ? 'text-red-600' : ''}>
                        ₹{bill.previousBalance}
                      </td>
                      <td className="font-medium">₹{bill.totalPayable}</td>
                      <td className="text-green-600">₹{bill.paidAmount}</td>
                      <td className={bill.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        ₹{bill.remainingBalance}
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Generate Bills Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-slide-up md:animate-none md:mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div>
                <h2 className="text-xl font-bold">Generate Bills</h2>
                <p className="text-sm text-indigo-100">Create monthly bills</p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    className="input text-base"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    className="input text-base"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">What this will do:</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Generate bills for all active customers for <strong>{selectedMonth} {selectedYear}</strong>. 
                        Existing bills for this period will be skipped.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={handleGenerateBills}
                className={`btn btn-primary flex-1 py-3 text-base font-semibold ${generating ? 'opacity-70' : ''}`}
                disabled={generating}
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FileText size={20} />
                    Generate Bills
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="btn btn-secondary px-6 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
