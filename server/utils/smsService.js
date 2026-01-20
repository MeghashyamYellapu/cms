const axios = require('axios');
const Settings = require('../models/Settings');

/**
 * SMS Service using popular SMS Gateway APIs
 * Supports: Twilio, MSG91, Fast2SMS, TextLocal
 */

/**
 * Send SMS via Twilio
 */
const sendViaTwilio = async (to, message, settings) => {
  try {
    const accountSid = settings.twilioAccountSid;
    const authToken = settings.twilioAuthToken;
    const fromNumber = settings.twilioPhoneNumber;

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: 'Twilio credentials missing' };
    }

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return { success: true, messageId: response.data.sid };
  } catch (error) {
    console.error('Twilio SMS Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Send SMS via MSG91 (Popular in India)
 */
const sendViaMSG91 = async (to, message, settings) => {
  try {
    const authKey = settings.msg91AuthKey;
    const senderId = settings.msg91SenderId || 'TXTIND';

    if (!authKey) {
      return { success: false, error: 'MSG91 Auth Key missing' };
    }

    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        flow_id: settings.msg91FlowId || '',
        sender: senderId,
        mobiles: to,
        message: message
      },
      {
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.request_id };
  } catch (error) {
    console.error('MSG91 SMS Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Send SMS via Fast2SMS (Popular in India)
 */
const sendViaFast2SMS = async (to, message, settings) => {
  try {
    const apiKey = settings.fast2smsApiKey;

    if (!apiKey) {
      return { success: false, error: 'Fast2SMS API Key missing' };
    }

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'v3',
        sender_id: settings.fast2smsSenderId || 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: to
      },
      {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.request_id };
  } catch (error) {
    console.error('Fast2SMS Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Main SMS sending function
 */
const sendSMS = async (to, message) => {
  try {
    const settings = await Settings.getSettings();

    if (!settings.smsEnabled) {
      console.log('SMS service is disabled');
      return { success: false, error: 'SMS service is disabled' };
    }

    // Format phone number
    let phone = to.replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '+91' + phone; // Default to India
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    // Try configured SMS provider
    const provider = settings.smsProvider || 'twilio';

    let result;
    switch (provider.toLowerCase()) {
      case 'twilio':
        result = await sendViaTwilio(phone, message, settings);
        break;
      case 'msg91':
        result = await sendViaMSG91(phone, message, settings);
        break;
      case 'fast2sms':
        result = await sendViaFast2SMS(phone, message, settings);
        break;
      default:
        result = { success: false, error: 'Unknown SMS provider' };
    }

    return result;
  } catch (error) {
    console.error('SMS Service Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Payment Receipt via SMS
 */
const sendPaymentReceiptSMS = async (customer, payment, billPeriod, companyDetails) => {
  try {
    if (!customer.phoneNumber) {
      return { success: false, message: 'Customer has no phone number' };
    }

    const settings = await Settings.getSettings();
    
    // Format the message
    const serviceType = customer.serviceType === 'SDV' ? 'Cable TV' : 
                       customer.serviceType === 'RailWire' ? 'Internet' : 
                       customer.serviceType;

    const message = `Hello ${customer.name} 👋
Your payment for ${serviceType} has been successfully received ✅

🧾 Receipt No: ${payment.receiptId}
👤 Customer ID: ${customer.customerId}
👤 Name: ${customer.name}
📅 Billing Period: ${billPeriod}
🕒 Generated On: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}
💰 Total Due: ₹${payment.billId?.totalPayable || 0}
💵 Amount Paid: ₹${payment.paidAmount}
💳 Payment Mode: ${payment.paymentMode}
💚 Remaining Balance: ₹${payment.remainingBalance}

Thank you for your cooperation and for choosing us! 😊

${companyDetails.companyName || 'Cable Service'}
📞 Contact: ${companyDetails.companyPhone || ''}
${companyDetails.companyAddress || ''}

🏢 Authorized Billing & Payment Receipt
This is system generated bill no need signature

Verify at: ${process.env.CLIENT_URL || 'https://your-portal.com'}/portal`;

    const result = await sendSMS(customer.phoneNumber, message);
    
    if (result.success) {
      return { success: true, status: 'Sent', messageId: result.messageId };
    }
    
    return { success: false, status: 'Failed', message: result.error };
  } catch (error) {
    console.error('Send Payment Receipt SMS Error:', error);
    return { success: false, status: 'Failed', message: error.message };
  }
};

module.exports = {
  sendSMS,
  sendPaymentReceiptSMS
};
