const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generate PDF receipt for payment
 * @param {Object} payment - Payment object with populated customer and bill
 * @returns {Promise<string>} - Path to generated PDF
 */
exports.generateReceipt = async (payment) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get settings from database
      const settings = await Settings.getSettings();
      
      const customer = payment.customerId;
      const bill = payment.billId;
      
      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // File path
      const fileName = `receipt_${payment.receiptId}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      
      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(settings.companyName, { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(settings.companyAddress, { align: 'center' })
         .text(`Phone: ${settings.companyPhone}`, { align: 'center' })
         .text(`Email: ${settings.companyEmail}`, { align: 'center' })
         .moveDown();

      // Receipt title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(settings.receiptHeader, { align: 'center' })
         .moveDown();

      // Receipt details
      doc.fontSize(10)
         .font('Helvetica');

      const leftColumn = 50;
      const rightColumn = 300;
      let yPosition = doc.y;

      // Receipt ID and Date
      doc.text(`Receipt ID:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${payment.receiptId}`);
      
      doc.font('Helvetica')
         .text(`Date:`, rightColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`);

      yPosition += 20;
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Customer Details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Customer Details')
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica');

      yPosition = doc.y;

      doc.text(`Customer ID:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${customer.customerId}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Name:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${customer.name}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Phone:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${customer.phoneNumber}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Service Type:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${customer.serviceType}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Area:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${customer.area}`);

      doc.moveDown(2);

      // Divider
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Payment Details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Payment Details')
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica');

      yPosition = doc.y;

      doc.text(`Billing Period:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${bill.month} ${bill.year}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Package Amount:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ₹${bill.packageAmount.toFixed(2)}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Previous Balance:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ₹${bill.previousBalance.toFixed(2)}`);
      
      yPosition += 15;
      doc.font('Helvetica')
         .text(`Total Payable:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ₹${bill.totalPayable.toFixed(2)}`);

      doc.moveDown(1.5);

      // Highlight paid amount
      doc.fontSize(12)
         .fillColor('#2563eb')
         .font('Helvetica-Bold')
         .text(`Amount Paid:`, leftColumn, doc.y, { continued: true })
         .fontSize(14)
         .text(` ₹${payment.paidAmount.toFixed(2)}`);

      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica');

      yPosition = doc.y + 15;
      doc.text(`Payment Mode:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${payment.paymentMode}`);

      if (payment.transactionId) {
        yPosition += 15;
        doc.font('Helvetica')
           .text(`Transaction ID:`, leftColumn, yPosition, { continued: true })
           .font('Helvetica-Bold')
           .text(` ${payment.transactionId}`);
      }

      yPosition += 15;
      doc.font('Helvetica')
         .text(`Remaining Balance:`, leftColumn, yPosition, { continued: true })
         .font('Helvetica-Bold')
         .fillColor(payment.remainingBalance > 0 ? '#dc2626' : '#16a34a')
         .text(` ₹${payment.remainingBalance.toFixed(2)}`);

      doc.fillColor('black');
      doc.moveDown(2);

      // Divider
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Footer
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .text('Thank you for your payment!', { align: 'center' })
         .moveDown(0.5)
         .text(settings.receiptFooter, { align: 'center' })
         .moveDown(1);

      doc.fontSize(8)
         .text(`Collected by: ${payment.collectedBy.name}`, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
