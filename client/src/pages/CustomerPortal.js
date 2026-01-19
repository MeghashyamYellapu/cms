import React, { useState } from 'react';
import { portalAPI } from '../services/api';
import { 
  Phone, 
  User, 
  MapPin, 
  Tv, 
  CreditCard, 
  Calendar,
  FileText,
  ChevronRight,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  Wifi,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerPortal = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setCustomerData(null);

    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setLoading(true);
    try {
      const response = await portalAPI.lookup(phoneNumber);
      if (response.data.success) {
        setCustomerData(response.data.data);
        setActiveTab('overview');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find customer. Please check the phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCustomerData(null);
    setPhoneNumber('');
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Paid</span>;
      case 'Partial':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Partial</span>;
      case 'Unpaid':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle size={12} /> Unpaid</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-600" size={24} />
            <span className="font-bold text-gray-800">Customer Portal</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Lookup Form */}
        {!customerData && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tv className="text-indigo-600" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Self-Service</h1>
              <p className="text-gray-600">Enter your registered mobile number to view your account details</p>
            </div>

            <form onSubmit={handleLookup} className="max-w-md mx-auto">
              <div className="relative mb-4">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  loading || phoneNumber.length !== 10
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                } ${loading ? 'btn-loading' : ''}`}
              >
                <Search size={20} />
                <span>{loading ? 'Looking up...' : 'View My Account'}</span>
              </button>
            </form>

            <div className="mt-8 pt-8 border-t text-center">
              <p className="text-sm text-gray-500">
                🔒 Your data is secure. We only display information linked to your registered phone number.
              </p>
            </div>
          </div>
        )}

        {/* Customer Data Display */}
        {customerData && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Search Another Number</span>
            </button>

            {/* Customer Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="text-indigo-600" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{customerData.customer.name}</h2>
                    <p className="text-gray-500">Customer ID: {customerData.customer.customerId}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-medium ${
                  customerData.customer.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customerData.customer.status}
                </div>
              </div>

              {/* Balance Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 text-white ${
                  customerData.customer.currentBalance < 0 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                }`}>
                  <p className="text-white/80 text-sm">
                    {customerData.customer.currentBalance < 0 ? 'Advance Balance' : 'Current Balance'}
                  </p>
                  <p className="text-2xl font-bold">
                    ₹{Math.abs(customerData.customer.currentBalance)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Package Amount</p>
                  <p className="text-xl font-bold text-gray-900">₹{customerData.customer.packageAmount}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">₹{customerData.summary.totalPaid}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Outstanding</p>
                  <p className={`text-xl font-bold ${customerData.customer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{customerData.customer.currentBalance > 0 ? customerData.customer.currentBalance : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex border-b">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'bills', label: 'Bills', icon: FileText },
                  { id: 'payments', label: 'Payments', icon: CreditCard }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User size={18} className="text-indigo-500" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Phone Number</span>
                          <span className="font-medium">{customerData.customer.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Aadhaar</span>
                          <span className="font-medium">{customerData.customer.maskedAadhaar}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Address</span>
                          <span className="font-medium text-right max-w-[200px]">{customerData.customer.address}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Area</span>
                          <span className="font-medium">{customerData.customer.area}</span>
                        </div>
                      </div>
                    </div>



                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Tv size={18} className="text-indigo-500" />
                          Service Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Service Type</span>
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                              {customerData.customer.serviceType}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Set-Top Box ID</span>
                            <span className="font-medium">{customerData.customer.setTopBoxId}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">CAF ID</span>
                            <span className="font-medium">{customerData.customer.cafId}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Member Since</span>
                            <span className="font-medium">{formatDate(customerData.customer.joinDate)}</span>
                          </div>
                        </div>
                      </div>


                    </div>
                  </div>
                )}

                {/* Bills Tab */}
                {activeTab === 'bills' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Recent Bills</h3>
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Paid: {customerData.summary.paidBills}</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Partial: {customerData.summary.partialBills}</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Unpaid: {customerData.summary.unpaidBills}</span>
                      </div>
                    </div>

                    {customerData.bills.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No bills found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerData.bills.map((bill, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Calendar className="text-indigo-500" size={20} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{bill.month} {bill.year}</p>
                                <p className="text-sm text-gray-500">Package: ₹{bill.packageAmount}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">₹{bill.totalPayable}</p>
                              {getStatusBadge(bill.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>

                    {customerData.payments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No payments found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerData.payments.map((payment, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <IndianRupee className="text-green-600" size={20} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">₹{payment.amount}</p>
                                <p className="text-sm text-gray-500">{payment.mode} • {formatDate(payment.date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Receipt</p>
                              <p className="font-mono text-sm text-indigo-600">{payment.receiptId}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Help Section */}
            {customerData.company && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-indigo-900 mb-2">Need Help?</h3>
                <p className="text-indigo-700 text-sm mb-4">
                  For billing queries or payments, please contact your cable operator:
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-indigo-800">
                  <div className="font-bold text-lg">{customerData.company.name}</div>
                  {customerData.company.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={16} />
                      <a href={`tel:${customerData.company.phone}`} className="hover:underline">{customerData.company.phone}</a>
                    </div>
                  )}
                  {customerData.company.email && (
                    <div className="flex items-center gap-1">
                      <span className="text-lg">@</span>
                      <a href={`mailto:${customerData.company.email}`} className="hover:underline">{customerData.company.email}</a>
                    </div>
                  )}
                </div>
                {customerData.company.address && (
                  <p className="text-indigo-600 text-sm mt-2">{customerData.company.address}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 Cable Billing Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortal;
