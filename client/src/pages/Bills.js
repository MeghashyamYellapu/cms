import React, { useState, useEffect } from 'react';
import { billAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">Manage monthly billing</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Generate Bills
        </button>
      </div>

      <div className="card p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText size={48} className="mb-4" />
            <p className="text-lg">No bills generated yet</p>
            <p className="text-sm">Click "Generate Bills" to create monthly bills</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
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
                {bills.map((bill) => (
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
        )}
      </div>

      {/* Generate Bills Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-xl max-w-md w-full h-full md:h-auto p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">Generate Monthly Bills</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  className="input"
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
                  className="input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This will generate bills for all active customers for {selectedMonth} {selectedYear}.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateBills}
                  className={`btn btn-primary flex-1 ${generating ? 'btn-loading' : ''}`}
                  disabled={generating}
                >
                  <span>{generating ? 'Generating...' : 'Generate Bills'}</span>
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
