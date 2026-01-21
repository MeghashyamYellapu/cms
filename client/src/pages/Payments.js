import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { paymentAPI, customerAPI, billAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Search, Send, Download, MessageCircle, User, Calendar, IndianRupee, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import html2canvas from 'html2canvas';
import ReceiptTemplate from '../components/ReceiptTemplate';

const Payments = () => {
  const location = useLocation();
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
  
  // Mobile expanded card state
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  
  // Search filter state
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchSettings();
  }, []);

  // Handle navigation from Customers page with selected customer
  useEffect(() => {
    if (location.state?.selectedCustomer) {
      const customer = location.state.selectedCustomer;
      setSelectedCustomer(customer);
      setSearchTerm(`${customer.name} - ${customer.phoneNumber}`);
      setShowAddModal(true);
      
      // Set formik customerId and fetch accurate balance data
      formik.setFieldValue('customerId', customer._id);
      
      // Set initial balance from passed customer data (use previousBalance as that's the model field)
      setTotalOutstanding(customer.previousBalance || 0);
      
      // Fetch fresh data for accurate balance
      fetchCustomerBalanceAndBills(customer._id);
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch accurate balance and bills for a customer
  const fetchCustomerBalanceAndBills = async (customerId) => {
    try {
      // 1. Fetch fresh customer data for accurate balance
      const custResponse = await customerAPI.getById(customerId);
      if (custResponse.data.data) {
        const freshCustomer = custResponse.data.data;
        setSelectedCustomer(freshCustomer);
        // Use previousBalance as that's the actual field in the Customer model
        setTotalOutstanding(freshCustomer.previousBalance || 0);
      }

      // 2. Fetch bills to find the latest active bill
      const billResponse = await billAPI.getByCustomer(customerId);
      const bills = billResponse.data.data;
      
      if (bills && bills.length > 0) {
        // Filter unpaid bills for display
        const unpaidBills = bills.filter(bill => bill.status !== 'Paid');
        setCustomerBills(unpaidBills);
        
        // Sort by creation date (newest first) to get latest bill
        const sortedBills = bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestBill = sortedBills[0];
        formik.setFieldValue('billId', latestBill._id);
        
        // Use the latest bill's remaining balance as the most accurate outstanding amount
        if (latestBill.remainingBalance !== undefined) {
          setTotalOutstanding(latestBill.remainingBalance);
        }
      } else {
        setCustomerBills([]);
      }
    } catch (error) {
      console.error('Error fetching customer balance and bills:', error);
    }
  };

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
      
      if (!element) {
        toast.dismiss('receipt-action');
        toast.error('Receipt template not ready');
        setPrintingPayment(null);
        setPrintAction(null);
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true 
      });
      
      const receiptId = printingPayment.receiptId;
      const fileName = `Receipt_${receiptId}.png`;

      // Convert to Blob using Promise wrapper for better error handling
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      });

      const file = new File([blob], fileName, { type: 'image/png' });
      
      // Dismiss loading toast
      toast.dismiss('receipt-action');

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

    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.dismiss('receipt-action');
      toast.error('Failed to generate receipt: ' + error.message);
      setPrintingPayment(null);
      setPrintAction(null);
    }
  };

  const shareToWhatsApp = async (file, payment) => {
    const customer = payment.customerId;
    const phoneNumber = customer?.phoneNumber || '';
    
    // Format phone: remove non-digits, ensure country code (default 91)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
    
    // Validate phone number
    if (!formattedPhone || formattedPhone.length < 10) {
      toast.error('Customer phone number is missing or invalid');
      return;
    }

    // Format service type
    const serviceType = customer?.serviceType === 'SDV' ? 'Cable TV' : 
                       customer?.serviceType === 'RailWire' ? 'Internet' : 
                       customer?.serviceType || 'Service';

    // Format bill period
    const billPeriod = payment.billId ? `${payment.billId.month} ${payment.billId.year}` : 'N/A';

    // Get company details from settings
    const companyName = settings?.companyName || 'Cable Service';
    const companyPhone = settings?.companyPhone || '';
    const companyAddress = settings?.companyAddress || '';

    // Create detailed message
    const message = `Hello ${customer?.name || 'Customer'} 👋
Your payment for ${serviceType} has been successfully received ✅

🧾 Payment Receipt No: ${payment.receiptId}
👤 Customer ID: ${customer?.customerId || 'N/A'}
👤 Customer Name: ${customer?.name || 'N/A'}
📅 Billing Period: ${billPeriod}
🕒 Generated On: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
💰 Total Due: ₹${payment.billId?.totalPayable || 0}
💵 Amount Paid: ₹${payment.paidAmount}
💳 Payment Mode: ${payment.paymentMode}
💚 Remaining Balance: ₹${payment.remainingBalance}

Thank you for your cooperation and for choosing us! 😊

${companyName}
📞 Contact: ${companyPhone}
${companyAddress}

🏢 Authorized Billing & Payment Receipt
This is system generated bill no need signature

Verify at: ${window.location.origin}/portal`;

    // Check if Web Share API is supported (mobile devices)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const canShare = navigator.canShare && navigator.share;
    
    if (canShare && isMobile) {
      // Mobile: Use Web Share API to share image + text together
      try {
        toast.loading('Preparing receipt for sharing...');
        
        // Ensure we have a proper blob
        let imageBlob = file;
        
        // If file is not already a Blob, convert it
        if (!(file instanceof Blob)) {
          console.error('File is not a Blob:', file);
          throw new Error('Invalid file format');
        }

        // Create a proper File object with correct MIME type
        const fileName = `Receipt_${payment.receiptId}.png`;
        const shareFile = new File([imageBlob], fileName, { 
          type: 'image/png',
          lastModified: Date.now()
        });

        // Verify the file can be shared
        const shareData = {
          title: 'Payment Receipt',
          text: message,
          files: [shareFile]
        };

        // Check if this data can be shared
        if (navigator.canShare && !navigator.canShare(shareData)) {
          console.log('Cannot share this data, falling back...');
          throw new Error('Share not supported for this data');
        }

        toast.dismiss();
        
        // Share the file
        await navigator.share(shareData);
        
        toast.success('✅ Receipt shared successfully!\n\nSelect WhatsApp to send.', {
          duration: 4000
        });
        
      } catch (error) {
        toast.dismiss();
        
        if (error.name === 'AbortError') {
          // User cancelled the share
          toast.info('Share cancelled');
        } else {
          console.error('Share error:', error);
          // Fallback to download + open WhatsApp
          toast.info('Using fallback method...');
          fallbackShareMethod(file, message, formattedPhone, payment.receiptId);
        }
      }
    } else {
      // Desktop or Web Share not supported: Download + Open WhatsApp
      fallbackShareMethod(file, message, formattedPhone, payment.receiptId);
    }
  };

  // Fallback method: Download image + Open WhatsApp
  const fallbackShareMethod = (file, message, formattedPhone, receiptId) => {
    // 1. Download the image
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receiptId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // 2. Open WhatsApp with a small delay to avoid popup blocker
    setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Use wa.me for better compatibility (works on both mobile and desktop)
      const whatsappUrl = isMobile 
          ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
          : `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
          
      // Use location.href as fallback if window.open is blocked
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup was blocked, try direct navigation
        window.location.href = whatsappUrl;
      }
    }, 300);
    
    toast('📎 Receipt downloaded!\n\n1. WhatsApp will open shortly\n2. Attach the downloaded image\n3. Send to customer', {
      icon: '✅',
      duration: 7000
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

  // Send receipt via SMS only
  const handleSendBoth = async (payment) => {
    try {
      const customer = payment.customerId;
      if (!customer || !customer.phoneNumber) {
        toast.error('Customer phone number not found');
        return;
      }

      // Format phone number
      let phone = customer.phoneNumber.replace(/[^0-9]/g, '');
      
      // Format service type
      const serviceType = customer.serviceType === 'SDV' ? 'Cable TV' : 
                         customer.serviceType === 'RailWire' ? 'Internet' : 
                         customer.serviceType;

      // Format bill period
      const billPeriod = payment.billId ? `${payment.billId.month} ${payment.billId.year}` : 'N/A';

      // Get company details from settings
      const companyName = settings?.companyName || 'Cable Service';
      const companyPhone = settings?.companyPhone || '';
      const companyAddress = settings?.companyAddress || '';

      // Create detailed message
      const message = `Hello ${customer.name} 👋
Your payment for ${serviceType} has been successfully received ✅

🧾 Payment Receipt No: ${payment.receiptId}
👤 Customer ID: ${customer.customerId}
👤 Customer Name: ${customer.name}
📅 Billing Period: ${billPeriod}
🕒 Generated On: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
💰 Total Due: ₹${payment.billId?.totalPayable || 0}
💵 Amount Paid: ₹${payment.paidAmount}
💳 Payment Mode: ${payment.paymentMode}
💚 Remaining Balance: ₹${payment.remainingBalance}

Thank you for your cooperation and for choosing us! 😊

${companyName}
📞 Contact: ${companyPhone}
${companyAddress}

🏢 Authorized Billing & Payment Receipt
This is system generated bill no need signature

Verify at: ${window.location.origin}/portal`;

      // Detect if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Open SMS app only
      const smsUrl = isMobile
        ? `sms:${phone}?body=${encodeURIComponent(message)}`
        : `sms:${phone}?body=${encodeURIComponent(message)}`;
      
      window.open(smsUrl, '_blank');
      
      toast.success('📱 SMS app opened with message!\n\nPlease send the SMS to customer.', {
        duration: 5000
      });

    } catch (error) {
      console.error('Send SMS error:', error);
      toast.error('Failed to open SMS app');
    }
  };

  // Uses client-side generation now
  const handleReceiptAction = (payment, action) => {
    toast.loading(action === 'share' ? 'Preparing receipt for WhatsApp...' : 'Generating receipt...', { id: 'receipt-action' });
    setPrintAction(action);
    setPrintingPayment(payment);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage payment records</p>
        </div>
        <button
          onClick={() => {
            formik.resetForm();
            setSearchTerm(''); // Reset search
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span className="text-sm sm:text-base">Record Payment</span>
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
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
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
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {payments
                .filter(payment => {
                  if (!searchFilter) return true;
                  const search = searchFilter.toLowerCase();
                  return (
                    payment.receiptId?.toLowerCase().includes(search) ||
                    payment.customerId?.name?.toLowerCase().includes(search) ||
                    payment.customerId?.phoneNumber?.includes(search) ||
                    payment.customerId?.customerId?.toLowerCase().includes(search)
                  );
                })
                .map((payment) => (
                <div 
                  key={payment._id} 
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Card Header - Always visible */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedPaymentId(expandedPaymentId === payment._id ? null : payment._id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{payment.customerId?.name}</p>
                        <p className="text-xs text-gray-500">{payment.customerId?.phoneNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{payment.paidAmount}</p>
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {payment.paymentMode}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{payment.receiptId}</span>
                        <span>•</span>
                        <span>{payment.billId?.month} {payment.billId?.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${payment.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {payment.remainingBalance < 0 
                            ? `Adv: ₹${Math.abs(payment.remainingBalance)}` 
                            : payment.remainingBalance > 0 
                              ? `Due: ₹${payment.remainingBalance}`
                              : 'Paid'
                          }
                        </span>
                        {expandedPaymentId === payment._id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedPaymentId === payment._id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-600">Customer ID:</span>
                        </div>
                        <span className="font-medium text-right">{payment.customerId?.customerId}</span>
                        
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-600">Date:</span>
                        </div>
                        <span className="font-medium text-right">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        
                        {payment.transactionId && (
                          <>
                            <div className="flex items-center gap-2">
                              <CreditCard size={14} className="text-gray-400" />
                              <span className="text-gray-600">Txn ID:</span>
                            </div>
                            <span className="font-medium text-right truncate">{payment.transactionId}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReceiptAction(payment, 'download');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Download size={16} />
                          Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReceiptAction(payment, 'share');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <Send size={16} />
                          WhatsApp
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendBoth(payment);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                        >
                          <MessageCircle size={16} />
                          SMS
                        </button>
                      </div>
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
                  {payments
                    .filter(payment => {
                      if (!searchFilter) return true;
                      const search = searchFilter.toLowerCase();
                      return (
                        payment.receiptId?.toLowerCase().includes(search) ||
                        payment.customerId?.name?.toLowerCase().includes(search) ||
                        payment.customerId?.phoneNumber?.includes(search) ||
                        payment.customerId?.customerId?.toLowerCase().includes(search)
                      );
                    })
                    .map((payment) => (
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReceiptAction(payment, 'download')}
                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleReceiptAction(payment, 'share')}
                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                            title="Share to WhatsApp"
                          >
                            <Send size={18} />
                          </button>
                          <button
                            onClick={() => handleSendBoth(payment)}
                            className="text-purple-600 hover:text-purple-800 p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Send via SMS"
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-xl w-full md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up md:animate-none md:mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0">
              <div>
                <h2 className="text-xl font-bold">Record Payment</h2>
                <p className="text-sm text-indigo-100">Enter payment details</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  formik.resetForm();
                  setSelectedCustomer(null);
                  setCustomerBills([]);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <form id="paymentForm" onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Customer Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input pl-10 text-base"
                      placeholder="Search by Name, ID, or Phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                        if (e.target.value === '') {
                           handleCustomerChange('');
                        }
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    
                    {/* Dropdown List */}
                    {isDropdownOpen && searchTerm && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {customers
                          .filter(c => 
                            (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.phoneNumber?.includes(searchTerm))
                          )
                          .slice(0, 10)
                          .map(customer => (
                            <div
                              key={customer._id}
                              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 active:bg-indigo-100"
                              onClick={() => {
                                handleCustomerChange(customer._id);
                                setSearchTerm(`${customer.name} - ${customer.customerId}`);
                                setIsDropdownOpen(false);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{customer.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{customer.customerId} • {customer.phoneNumber}</p>
                                </div>
                                <div className="text-right">
                                  {customer.previousBalance < 0 ? (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                      Adv: ₹{Math.abs(customer.previousBalance)}
                                    </span>
                                  ) : customer.previousBalance > 0 ? (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                      Due: ₹{customer.previousBalance}
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                      No Dues
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {customers.filter(c => 
                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phoneNumber?.includes(searchTerm)
                          ).length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">No match found</div>
                          )}
                      </div>
                    )}
                  </div>
                  {formik.touched.customerId && formik.errors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.customerId}</p>
                  )}
                </div>

                {/* Selected Customer Balance Card */}
                {selectedCustomer && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                          <p className="text-xs text-gray-500">{selectedCustomer.customerId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Current Balance</p>
                        <p className={`text-xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalOutstanding < 0 ? `₹${Math.abs(totalOutstanding)}` : `₹${totalOutstanding}`}
                        </p>
                        {totalOutstanding < 0 && (
                          <p className="text-xs text-green-600">Advance</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hidden Bill ID field */}
                <input type="hidden" {...formik.getFieldProps('billId')} />

                {/* Amount and Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        className="input pl-8 text-lg font-semibold"
                        placeholder="0"
                        {...formik.getFieldProps('paidAmount')}
                      />
                    </div>
                    {formik.values.paidAmount !== '' && selectedCustomer && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {(() => {
                          const paid = Number(formik.values.paidAmount);
                          const newBalance = totalOutstanding - paid;
                          return newBalance < 0 ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-700">Advance After:</span>
                              <span className="font-bold text-green-600">₹{Math.abs(newBalance)}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Remaining Due:</span>
                              <span className={`font-bold ${newBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{Math.max(0, newBalance)}
                              </span>
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
                    <select className="input text-base" {...formik.getFieldProps('paymentMode')}>
                      <option value="Cash">💵 Cash</option>
                      <option value="UPI">📱 UPI</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="Cheque">📝 Cheque</option>
                      <option value="Card">💳 Card</option>
                    </select>
                  </div>
                </div>

                {/* Transaction ID - Show only for digital payments */}
                {formik.values.paymentMode !== 'Cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter transaction reference"
                      {...formik.getFieldProps('transactionId')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="input"
                    rows="2"
                    placeholder="Any additional notes..."
                    {...formik.getFieldProps('notes')}
                  />
                </div>
              </form>
            </div>
            
            {/* Modal Footer - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                type="submit"
                form="paymentForm"
                className={`btn btn-primary flex-1 py-3 text-base font-semibold ${formik.isSubmitting ? 'opacity-70' : ''}`}
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Recording...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard size={20} />
                    Record Payment
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  formik.resetForm();
                  setSelectedCustomer(null);
                  setCustomerBills([]);
                  setSearchTerm('');
                }}
                className="btn btn-secondary px-6 py-3"
              >
                Cancel
              </button>
            </div>
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
