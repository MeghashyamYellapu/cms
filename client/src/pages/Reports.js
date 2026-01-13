import React, { useState } from 'react';
import { customerAPI, billAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart3, Download, FileText } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('customers');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

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
          response = await paymentAPI.getStats();
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and export business reports</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <BarChart3 size={20} />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              disabled={!reportData}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Export to Excel
            </button>
          </div>
        </div>

        {reportData && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(reportData).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="text-blue-600 mb-4" size={32} />
          <h3 className="font-semibold text-lg mb-2">Customer Ledger</h3>
          <p className="text-gray-600 text-sm">View detailed customer transaction history</p>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="text-green-600 mb-4" size={32} />
          <h3 className="font-semibold text-lg mb-2">Revenue Analysis</h3>
          <p className="text-gray-600 text-sm">Analyze revenue trends and patterns</p>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="text-purple-600 mb-4" size={32} />
          <h3 className="font-semibold text-lg mb-2">Outstanding Dues</h3>
          <p className="text-gray-600 text-sm">Track pending payments and dues</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
