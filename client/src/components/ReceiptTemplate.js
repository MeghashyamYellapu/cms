import React, { forwardRef } from 'react';

const ReceiptTemplate = forwardRef(({ payment, settings }, ref) => {
  if (!payment) return null;

  return (
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
      <div 
        ref={ref} 
        style={{ 
          width: '550px', 
          backgroundColor: '#fff', 
          padding: '40px',
          fontFamily: 'Inter, sans-serif'
        }}
        id="receipt-content"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs font-bold text-indigo-500 tracking-[0.2em] mb-3 uppercase">
            Payment Receipt
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
            {settings?.companyName || 'Cable Operator'}
          </h1>
          <div className="text-sm text-slate-500">
            Contact: {settings?.companyPhone}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer Name
            </div>
            <div className="text-sm font-bold text-slate-800">
              {payment.customerId?.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Billing Period
            </div>
            <div className="text-sm font-bold text-slate-800">
              {payment.billId?.month} {payment.billId?.year}
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-8">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Receipt No
            </div>
            <div className="text-sm font-bold text-slate-800 font-mono">
              {payment.receiptId?.replace('RCP', '')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Generated At
            </div>
            <div className="text-sm font-bold text-slate-800">
              {new Date(payment.paymentDate).toLocaleDateString('en-GB', { 
                day: '2-digit', month: 'short', year: '2-digit' 
              })} 
              <span className="text-slate-400 ml-2">
                {new Date(payment.paymentDate).toLocaleTimeString('en-US', { 
                  hour: '2-digit', minute: '2-digit', hour12: false 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-slate-500">Total Due</span>
            <span className="font-bold text-slate-700">₹{((payment.remainingBalance || 0) + (payment.paidAmount || 0)).toFixed(0)}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-bold text-slate-700">₹{payment.paidAmount?.toFixed(0)}</span>
          </div>
          
          <div className="bg-indigo-500 text-white p-4 rounded-lg flex justify-between items-center shadow-lg shadow-indigo-200">
            <span className="text-xs font-bold tracking-widest uppercase">Net Amount Paid</span>
            <span className="text-2xl font-extrabold">₹{payment.paidAmount?.toFixed(0)}</span>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="text-center mb-8">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Remaining Balance
          </div>
          <div className={`text-3xl font-extrabold ${payment.remainingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            ₹{payment.remainingBalance?.toFixed(1)}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Payment Mode: {payment.paymentMode}
            </span>
          </div>
          
          <p className="text-[10px] text-slate-400 mb-2">
            {settings?.receiptFooter || 'Thank you for your business!'}
          </p>
          <div className="inline-block bg-slate-100 rounded-full px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Authentic Receipt • Digital Audit Log
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReceiptTemplate;
