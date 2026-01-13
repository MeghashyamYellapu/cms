const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generate receipt image using puppeteer
 * @param {Object} payment - Payment object with populated customer and bill
 * @returns {Promise<string>} - Path to generated image
 */
exports.generateReceipt = async (payment) => {
  try {
    // Get settings from database
    const settings = await Settings.getSettings();
    
    const customer = payment.customerId;
    const bill = payment.billId;
    
    // Create HTML for the receipt
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: #f5f5f5;
      padding: 0;
      margin: 0;
    }
    
    .receipt {
      width: 550px;
      background: white;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    
    .receipt-title {
      font-size: 11px;
      color: #6366f1;
      font-weight: 600;
      letter-spacing: 2px;
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 32px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 5px;
      letter-spacing: -0.5px;
    }
    
    .company-contact {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 30px;
    }
    
    .info-section {
      margin-bottom: 25px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .info-label {
      color: #94a3b8;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    .info-value {
      color: #1e293b;
      font-weight: 600;
      font-size: 14px;
    }
    
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .meta-item {
      text-align: center;
    }
    
    .meta-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .meta-value {
      font-size: 13px;
      color: #1e293b;
      font-weight: 700;
    }
    
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 25px 0;
    }
    
    .amounts-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    
    .amount-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .amount-label {
      color: #64748b;
    }
    
    .amount-value {
      color: #1e293b;
      font-weight: 600;
    }
    
    .net-amount {
      background: #6366f1;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0;
    }
    
    .net-label {
      font-size: 12px;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    .net-value {
      font-size: 24px;
      font-weight: 800;
    }
    
    .remaining-balance {
      text-align: center;
      margin: 20px 0;
    }
    
    .remaining-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .remaining-value {
      font-size: 28px;
      font-weight: 800;
      color: ${payment.remainingBalance > 0 ? '#ef4444' : '#10b981'};
    }
    
    .payment-mode {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 20px 0;
    }
    
    .mode-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
    }
    
    .mode-text {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.6;
    }
    
    .collected-by {
      font-size: 11px;
      color: #64748b;
      margin-top: 10px;
    }
    
    .audit-badge {
      display: inline-block;
      background: #f1f5f9;
      color: #64748b;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="receipt-title">PAYMENT RECEIPT</div>
      <div class="company-name">${settings.companyName}</div>
      <div class="company-contact">Contact ${settings.companyPhone}</div>
    </div>
    
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Customer Name</span>
        <span class="info-value">${customer.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Billing Period</span>
        <span class="info-value">${bill.month} ${bill.year}</span>
      </div>
    </div>
    
    <div class="receipt-meta">
      <div class="meta-item">
        <div class="meta-label">Receipt No</div>
        <div class="meta-value">${payment.receiptId.replace('RCP', '')}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Generated At</div>
        <div class="meta-value">${new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} ${new Date(payment.paymentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="amounts-section">
      <div class="amount-row">
        <span class="amount-label">Previous Balance</span>
        <span class="amount-value">₹${bill.previousBalance.toFixed(0)}</span>
      </div>
      <div class="amount-row">
        <span class="amount-label">Amount Paid</span>
        <span class="amount-value">₹${payment.paidAmount.toFixed(0)}</span>
      </div>
    </div>
    
    <div class="net-amount">
      <span class="net-label">NET AMOUNT PAID</span>
      <span class="net-value">₹${payment.paidAmount.toFixed(0)}</span>
    </div>
    
    <div class="remaining-balance">
      <div class="remaining-label">Remaining Balance</div>
      <div class="remaining-value">₹${payment.remainingBalance.toFixed(1)}</div>
    </div>
    
    <div class="payment-mode">
      <span class="mode-dot"></span>
      <span class="mode-text">Payment Mode: ${payment.paymentMode}</span>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        ${settings.receiptFooter}
      </div>
      <div class="collected-by">Collected by: ${payment.collectedBy.name}</div>
      <div class="audit-badge">AUTHENTIC RECEIPT DIGITAL AUDIT LOG</div>
    </div>
  </div>
</body>
</html>
    `;
    
    // Try to use puppeteer if available, otherwise save as HTML
    try {
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html);
      await page.setViewport({ width: 550, height: 800 });
      
      const fileName = `receipt_${payment.receiptId}.png`;
      const filePath = path.join(receiptsDir, fileName);
      
      await page.screenshot({
        path: filePath,
        fullPage: true,
        omitBackground: false
      });
      
      await browser.close();
      
      return filePath;
    } catch (error) {
      console.log('Puppeteer not available, saving as HTML:', error.message);
      
      // Fallback to HTML if puppeteer fails
      const fileName = `receipt_${payment.receiptId}.html`;
      const filePath = path.join(receiptsDir, fileName);
      fs.writeFileSync(filePath, html);
      
      return filePath;
    }
  } catch (error) {
    console.error('Receipt generation error:', error);
    throw error;
  }
};
