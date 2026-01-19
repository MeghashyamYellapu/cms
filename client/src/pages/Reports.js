import React, { useState, useEffect } from 'react';
import { customerAPI, billAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart3, Download, FileText, Users, DollarSign, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [reportType, setReportType] = useState('customers');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Detail view states
  const [activeDetailView, setActiveDetailView] = useState(null); // 'ledger', 'revenue', 'outstanding'
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Date filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateReport = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (reportType) {
        case 'customers':
          response = await customerAPI.getStats();
          break;
        case 'bills':
          response = await billAPI.getStats();
          break;
        case 'payments':
          response = await paymentAPI.getStats(dateRange);
          break;
        default:
          break;
      }
      
      setReportData(response.data.data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Generate report error:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }

    try {
      // Flatten report data for Excel
      const exportData = [];
      
      if (reportType === 'customers') {
        exportData.push({
          'Total Customers': reportData.totalCustomers,
          'Active Customers': reportData.activeCustomers,
          'Inactive Customers': reportData.inactiveCustomers
        });
        
        // Add service type breakdown
        if (reportData.serviceTypeStats) {
          reportData.serviceTypeStats.forEach(item => {
            exportData.push({
              'Service Type': item._id,
              'Count': item.count
            });
          });
        }
      } else if (reportType === 'bills') {
        exportData.push({
          'Total Bills': reportData.totalBills,
          'Paid Bills': reportData.paidBills,
          'Unpaid Bills': reportData.unpaidBills,
          'Partial Bills': reportData.partialBills,
          'Total Payable': reportData.totalPayable,
          'Total Paid': reportData.totalPaid,
          'Total Pending': reportData.totalPending
        });
      } else if (reportType === 'payments') {
        exportData.push({
          'Total Payments': reportData.totalPayments,
          'Total Amount': reportData.totalAmount,
          'Average Amount': reportData.avgAmount?.toFixed(2)
        });
        
        // Add payment mode breakdown
        if (reportData.paymentModeStats) {
          reportData.paymentModeStats.forEach(item => {
            exportData.push({
              'Payment Mode': item._id,
              'Count': item.count,
              'Amount': item.amount
            });
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${reportType}_report`);
      
      const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Fetch Customer Ledger (all customers with their balances)
  const fetchCustomerLedger = async () => {
    try {
      setDetailLoading(true);
      setActiveDetailView('ledger');
      const response = await customerAPI.getAll({ limit: 1000 });
      setDetailData(response.data.data || []);
    } catch (error) {
      console.error('Fetch ledger error:', error);
      toast.error('Failed to load customer ledger');
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch Revenue Analysis (payments grouped by date/month)
  const fetchRevenueAnalysis = async () => {
    try {
      setDetailLoading(true);
      setActiveDetailView('revenue');
      const response = await paymentAPI.getStats(dateRange);
      // Use dailyCollections from stats
      setDetailData(response.data.data?.dailyCollections || []);
    } catch (error) {
      console.error('Fetch revenue error:', error);
      toast.error('Failed to load revenue analysis');
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch Outstanding Dues (unpaid/partial bills)
  const fetchOutstandingDues = async () => {
    try {
      setDetailLoading(true);
      setActiveDetailView('outstanding');
      const response = await billAPI.getAll({ status: 'Unpaid', limit: 500 });
      const partialResponse = await billAPI.getAll({ status: 'Partial', limit: 500 });
      const combined = [...(response.data.data || []), ...(partialResponse.data.data || [])];
      setDetailData(combined);
    } catch (error) {
      console.error('Fetch outstanding error:', error);
      toast.error('Failed to load outstanding dues');
    } finally {
      setDetailLoading(false);
    }
  };

  // Export detail data to Excel
  const exportDetailToExcel = () => {
    if (!detailData.length) {
      toast.error('No data to export');
      return;
    }

    try {
      let exportData = [];
      let sheetName = 'Report';

      if (activeDetailView === 'ledger') {
        sheetName = 'Customer_Ledger';
        exportData = detailData.map(c => ({
          'Customer ID': c.customerId,
          'Name': c.name,
          'Phone': c.phoneNumber,
          'Area': c.area,
          'Service': c.serviceType,
          'Package': c.packageAmount,
          'Balance': c.previousBalance,
          'Status': c.status
        }));
      } else if (activeDetailView === 'revenue') {
        sheetName = 'Revenue_Analysis';
        exportData = detailData.map(d => ({
          'Date': d._id,
          'Transactions': d.count,
          'Amount': d.amount
        }));
      } else if (activeDetailView === 'outstanding') {
        sheetName = 'Outstanding_Dues';
        exportData = detailData.map(b => ({
          'Customer': b.customerId?.name || 'N/A',
          'Customer ID': b.customerId?.customerId || 'N/A',
          'Phone': b.customerId?.phoneNumber || 'N/A',
          'Period': `${b.month} ${b.year}`,
          'Total Payable': b.totalPayable,
          'Paid': b.paidAmount,
          'Remaining': b.remainingBalance,
          'Status': b.status
        }));
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const fileName = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Calculate totals for outstanding dues
  const outstandingTotals = activeDetailView === 'outstanding' 
    ? detailData.reduce((acc, b) => ({ 
        total: acc.total + (b.remainingBalance || 0),
        count: acc.count + 1 
      }), { total: 0, count: 0 })
    : { total: 0, count: 0 };

  // Calculate totals for revenue
  const revenueTotals = activeDetailView === 'revenue'
    ? detailData.reduce((acc, d) => ({
        total: acc.total + (d.amount || 0),
        transactions: acc.transactions + (d.count || 0)
      }), { total: 0, transactions: 0 })
    : { total: 0, transactions: 0 };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {activeDetailView && (
          <button 
            onClick={() => setActiveDetailView(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeDetailView === 'ledger' && 'Customer Ledger'}
            {activeDetailView === 'revenue' && 'Revenue Analysis'}
            {activeDetailView === 'outstanding' && 'Outstanding Dues'}
            {!activeDetailView && 'Reports'}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeDetailView ? 'Detailed view' : 'Generate and export business reports'}
          </p>
        </div>
      </div>

      {/* Main Report Generator (show only when no detail view) */}
      {!activeDetailView && (
        <>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  className="input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="customers">Customer Report</option>
                  <option value="bills">Billing Report</option>
                  <option value="payments">Payment Report</option>
                </select>
              </div>

              {reportType === 'payments' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="flex items-end gap-2">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className={`btn btn-primary flex-1 flex items-center justify-center gap-2 ${loading ? 'btn-loading' : ''}`}
                >
                  <BarChart3 size={20} />
                  <span>{loading ? 'Generating...' : 'Generate'}</span>
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={exportToExcel}
                  disabled={!reportData}
                  className="btn btn-success w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={20} />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Report Summary */}
            {reportData && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData).map(([key, value]) => {
                    // Skip arrays and objects
                    if (typeof value === 'object') return null;
                    
                    return (
                      <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border">
                        <p className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {typeof value === 'number' 
                            ? (key.toLowerCase().includes('amount') || key.toLowerCase().includes('payable') || key.toLowerCase().includes('paid') || key.toLowerCase().includes('pending'))
                              ? `₹${value.toLocaleString('en-IN')}`
                              : value.toLocaleString('en-IN')
                            : value
                          }
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={fetchCustomerLedger}
              className="card hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Users className="text-blue-600" size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Customer Ledger</h3>
                  <p className="text-gray-600 text-sm">View all customers with balances</p>
                </div>
              </div>
            </div>

            <div 
              onClick={fetchRevenueAnalysis}
              className="card hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <DollarSign className="text-green-600" size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Revenue Analysis</h3>
                  <p className="text-gray-600 text-sm">Daily collection trends</p>
                </div>
              </div>
            </div>

            <div 
              onClick={fetchOutstandingDues}
              className="card hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                  <AlertTriangle className="text-orange-600" size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Outstanding Dues</h3>
                  <p className="text-gray-600 text-sm">Track pending payments</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Views */}
      {activeDetailView && (
        <div className="card">
          {/* Actions Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {activeDetailView === 'outstanding' && (
                <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
                  <span className="text-red-800 font-medium">
                    Total Outstanding: ₹{outstandingTotals.total.toLocaleString('en-IN')} ({outstandingTotals.count} bills)
                  </span>
                </div>
              )}
              {activeDetailView === 'revenue' && (
                <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                  <span className="text-green-800 font-medium">
                    Total Revenue: ₹{revenueTotals.total.toLocaleString('en-IN')} ({revenueTotals.transactions} transactions)
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={exportDetailToExcel}
              className="btn btn-success flex items-center gap-2"
            >
              <Download size={18} />
              Export to Excel
            </button>
          </div>

          {/* Loading State */}
          {detailLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          )}

          {/* Customer Ledger Table */}
          {activeDetailView === 'ledger' && !detailLoading && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Area</th>
                    <th>Service</th>
                    <th>Package</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.map(customer => (
                    <tr key={customer._id}>
                      <td className="font-medium">{customer.customerId}</td>
                      <td>{customer.name}</td>
                      <td>{customer.phoneNumber}</td>
                      <td>{customer.area}</td>
                      <td><span className="badge badge-info">{customer.serviceType}</span></td>
                      <td>₹{customer.packageAmount}</td>
                      <td className={customer.previousBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {customer.previousBalance > 0 ? `₹${customer.previousBalance}` : 'Clear'}
                      </td>
                      <td>
                        <span className={`badge ${customer.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Revenue Analysis Table */}
          {activeDetailView === 'revenue' && !detailLoading && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transactions</th>
                    <th>Amount Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.length > 0 ? detailData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{item._id}</td>
                      <td>{item.count}</td>
                      <td className="text-green-600 font-medium">₹{item.amount?.toLocaleString('en-IN')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-gray-500">
                        No revenue data for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Outstanding Dues Table */}
          {activeDetailView === 'outstanding' && !detailLoading && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Period</th>
                    <th>Total Payable</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.length > 0 ? detailData.map(bill => (
                    <tr key={bill._id}>
                      <td>
                        <div>
                          <p className="font-medium">{bill.customerId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{bill.customerId?.customerId}</p>
                        </div>
                      </td>
                      <td>{bill.customerId?.phoneNumber || 'N/A'}</td>
                      <td>{bill.month} {bill.year}</td>
                      <td>₹{bill.totalPayable}</td>
                      <td className="text-green-600">₹{bill.paidAmount}</td>
                      <td className="text-red-600 font-medium">₹{bill.remainingBalance}</td>
                      <td>
                        <span className={`badge ${bill.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No outstanding dues! All bills are paid.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
