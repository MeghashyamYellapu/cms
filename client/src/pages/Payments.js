import React, { useState, useEffect, useRef } from 'react';
import { paymentAPI, customerAPI, billAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Search, Send, Download } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import html2canvas from 'html2canvas';
import ReceiptTemplate from '../components/ReceiptTemplate';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerBills, setCustomerBills] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  
  // Receipt generation state
  const [settings, setSettings] = useState(null);
  const [printingPayment, setPrintingPayment] = useState(null);
  const [printAction, setPrintAction] = useState(null); // 'download' or 'share'
  const receiptRef = useRef(null);

  // Combobox State
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  // Handle client-side image generation
  useEffect(() => {
    if (printingPayment && receiptRef.current && printAction) {
      processReceiptAction();
    }
  }, [printingPayment, printAction]);

  const processReceiptAction = async () => {
    try {
      // Small delay to render off-screen
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true 
      });
      
      const receiptId = printingPayment.receiptId;
      const fileName = `Receipt_${receiptId}.png`;

      // Convert to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        const file = new File([blob], fileName, { type: 'image/png' });

        if (printAction === 'download') {
          // DOWNLOAD ACTION
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('Receipt downloaded successfully');

        } else if (printAction === 'share') {
          // SHARE ACTION
          await shareToWhatsApp(file, printingPayment);
        }
        
        // Reset state
        setPrintingPayment(null);
        setPrintAction(null);
      }, 'image/png');

    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Failed to generate receipt');
      setPrintingPayment(null);
      setPrintAction(null);
    }
  };

  const shareToWhatsApp = async (file, payment) => {
    const phoneNumber = payment.customerId?.phoneNumber || '';
    // Format phone: remove non-digits, ensure country code (default 91)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

    const message = `Payment Receipt for ${payment.receiptId}\nAmount: ₹${payment.paidAmount}`;

    // METHOD: Direct WhatsApp Link (Targets specific number)
    // Note: We cannot programmatically attach the file to the WhatsApp chat via URL.
    // So we: 1. Download the image, 2. Open the specific Chat, 3. User attaches the downloaded image.
    
    // 1. Download the image
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 2. Open WhatsApp Chat directly to the customer number
    // Use whatsapp:// protocol for better mobile experience if possible, fallback to web
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile 
        ? `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
        
    window.open(whatsappUrl, '_blank');
    
    toast('Image downloaded! Please attach it to the WhatsApp chat.', {
      icon: '📎',
      duration: 5000
    });
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAll({ limit: 50 });
      setPayments(response.data.data);
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ limit: 1000, status: 'Active' });
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchCustomerBills = async (customerId) => {
    try {
      const response = await billAPI.getByCustomer(customerId);
      const unpaidBills = response.data.data.filter(bill => bill.status !== 'Paid');
      setCustomerBills(unpaidBills);
    } catch (error) {
      console.error('Fetch bills error:', error);
    }
  };

  const formik = useFormik({
    initialValues: {
      customerId: '',
      billId: '',
      paidAmount: '',
      paymentMode: 'Cash',
      transactionId: '',
      notes: ''
    },
    validationSchema: Yup.object({
      customerId: Yup.string().required('Customer is required'),
      billId: Yup.string().required('Bill is required'),
      paidAmount: Yup.number()
        .min(1, 'Amount must be greater than 0')
        .required('Amount is required'),
      paymentMode: Yup.string().required('Payment mode is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await paymentAPI.create(values);
        toast.success('Payment recorded successfully');
        resetForm();
        setShowAddModal(false);
        setSelectedCustomer(null);
        setCustomerBills([]);
        setTotalOutstanding(0);
        fetchPayments();
        fetchCustomers(); // Refresh customer list to update balances
      } catch (error) {
        toast.error(error.response?.data?.message || 'Payment failed');
      }
    }
  });

  const handleCustomerChange = async (customerId) => {
    formik.setFieldValue('customerId', customerId);
    
    // Reset payment related fields
    formik.setFieldValue('billId', '');
    
    // Find basic info from list first
    const listCustomer = customers.find(c => c._id === customerId);
    setSelectedCustomer(listCustomer);

    // Set initial balance from list data to avoid "0" flash
    if (listCustomer) {
        setTotalOutstanding(listCustomer.previousBalance || 0);
    } else {
        setTotalOutstanding(0);
    }

    if (customerId) {
        try {
            // 1. Fetch fresh customer data for accurate balance
            const custResponse = await customerAPI.getById(customerId);
            if (custResponse.data.data) {
                setTotalOutstanding(custResponse.data.data.previousBalance);
                setSelectedCustomer(custResponse.data.data); // Update with fresh data
            }

            // 2. Fetch bills to find the latest active bill for ID
            const billResponse = await billAPI.getByCustomer(customerId);
            const bills = billResponse.data.data;
            
            if (bills && bills.length > 0) {
                // Sort by creation date (newest first)
                const sortedBills = bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const latestBill = sortedBills[0];
                formik.setFieldValue('billId', latestBill._id);
                
                // Use the latest bill's remaining balance as the most accurate outstanding amount
                setTotalOutstanding(latestBill.remainingBalance);
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
            toast.error('Could not fetch customer details');
        }
    }
  };

  const handleResendReceipt = async (paymentId) => {
    try {
      await paymentAPI.resendReceipt(paymentId);
      toast.success('Receipt sent successfully');
      fetchPayments(); // Refresh to update WhatsApp status
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send receipt');
    }
  };

  // Uses client-side generation now
  const handleReceiptAction = (payment, action) => {
    setPrintAction(action);
    setPrintingPayment(payment);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage payment records</p>
        </div>
        <button
          onClick={() => {
            formik.resetForm();
            setSearchTerm(''); // Reset search
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by customer name, receipt ID..."
            className="input pl-10"
            // Add search logic if needed
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="loading h-8 w-8"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CreditCard size={48} className="mb-4" />
            <p className="text-lg">No payments recorded yet</p>
            <p className="text-sm">Click "Record Payment" to add a payment</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Customer</th>
                  <th>Bill Period</th>
                  <th>Amount Paid</th>
                  <th>Remaining</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="font-medium">{payment.receiptId}</td>
                    <td>
                      <div>
                        <p className="font-medium">{payment.customerId?.name}</p>
                        <p className="text-sm text-gray-500">{payment.customerId?.phoneNumber}</p>
                      </div>
                    </td>
                    <td>{payment.billId?.month} {payment.billId?.year}</td>
                    <td className="text-green-600 font-medium">₹{payment.paidAmount}</td>
                    <td className={`font-medium ${payment.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {payment.remainingBalance < 0 
                        ? `Advance: ₹${Math.abs(payment.remainingBalance)}` 
                        : `₹${payment.remainingBalance}`
                      }
                    </td>
                    <td>
                      <span className="badge badge-info">{payment.paymentMode}</span>
                    </td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleReceiptAction(payment, 'download')}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1"
                          title="Download Receipt"
                        >
                          <Download size={22} />
                        </button>
                        <button
                          onClick={() => handleReceiptAction(payment, 'share')}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1 p-1"
                          title="Share to WhatsApp"
                        >
                          <Send size={22} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-xl max-w-2xl w-full h-full md:h-auto overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
            
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Search by Name, ID, or Phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      if (e.target.value === '') {
                         handleCustomerChange(''); // Clear selection if input cleared
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  
                  {/* Dropdown List */}
                  {isDropdownOpen && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customers
                        .filter(c => 
                          (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phoneNumber?.includes(searchTerm))
                        )
                        .map(customer => (
                          <div
                            key={customer._id}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0"
                            onClick={() => {
                              handleCustomerChange(customer._id);
                              setSearchTerm(`${customer.name} - ${customer.customerId}`);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                               <span>ID: {customer.customerId}</span>
                               <span>Ph: {customer.phoneNumber}</span>
                            </div>
                            <div className="text-xs mt-1 text-right">
                                {customer.previousBalance < 0 ? (
                                    <span className="text-green-600 font-medium">Advance: ₹{Math.abs(customer.previousBalance)}</span>
                                ) : customer.previousBalance > 0 ? (
                                    <span className="text-red-600 font-medium">Due: ₹{customer.previousBalance}</span>
                                ) : (
                                    <span className="text-gray-500">No Dues</span>
                                )}
                            </div>
                          </div>
                        ))}
                        {customers.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                            <div className="p-3 text-center text-gray-500 text-sm">No match found</div>
                        )}
                    </div>
                  )}
                </div>
                {formik.touched.customerId && formik.errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.customerId}</p>
                )}
              </div>

              {selectedCustomer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                     <span className="text-gray-700 font-medium">Current Balance:</span>
                     <span className={`text-xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {totalOutstanding < 0 ? `Advance: ₹${Math.abs(totalOutstanding)}` : `₹${totalOutstanding}`}
                     </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Balance before this payment.
                  </p>
                </div>
              )}
              
              {/* Hidden Bill ID field (managed automatically) */}
              <input type="hidden" {...formik.getFieldProps('billId')} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    {...formik.getFieldProps('paidAmount')}
                  />
                  {formik.values.paidAmount !== '' && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                         {(() => {
                            const paid = Number(formik.values.paidAmount);
                            const newBalance = totalOutstanding - paid;
                            return newBalance < 0 ? (
                                <div className="flex justify-between items-center text-green-700">
                                    <span className="text-sm font-medium">Projected Advance:</span>
                                    <span className="font-bold">₹{Math.abs(newBalance)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-gray-700">
                                    <span className="text-sm font-medium">Remaining Due:</span>
                                    <span className="font-bold">₹{Math.max(0, newBalance)}</span>
                                </div>
                            );
                         })()}
                    </div>
                  )}
                  {formik.touched.paidAmount && formik.errors.paidAmount && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.paidAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <select className="input" {...formik.getFieldProps('paymentMode')}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="For digital payments"
                  {...formik.getFieldProps('transactionId')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="input"
                  rows="2"
                  {...formik.getFieldProps('notes')}
                />
              </div>

              <div className="flex gap-3 pt-4 pb-4 md:pb-0">
                <button
                  type="submit"
                  className={`btn btn-primary flex-1 ${formik.isSubmitting ? 'btn-loading' : ''}`}
                  disabled={formik.isSubmitting}
                >
                  <span>{formik.isSubmitting ? 'Recording...' : 'Record Payment'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    formik.resetForm();
                    setSelectedCustomer(null);
                    setCustomerBills([]);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Receipt Template */}
      <ReceiptTemplate 
        ref={receiptRef} 
        payment={printingPayment} 
        settings={settings} 
      />
    </div>
  );
};

export default Payments;
