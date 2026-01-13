const axios = require('axios');
const Settings = require('../models/Settings');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Send text message via Meta API
 */
const sendViaMetaAPI = async (to, message) => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.whatsappApiKey || !settings.whatsappPhoneId) {
      console.log('WhatsApp settings missing');
      return { success: false, error: 'WhatsApp API Key or Phone ID missing' };
    }

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${settings.whatsappPhoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.whatsappApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.messages) {
      console.log('WhatsApp text message sent:', response.data.messages[0].id);
      return { success: true, messageId: response.data.messages[0].id };
    }
    return { success: false, error: 'No message ID returned' };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

/**
 * Send Image Message (Uploads media first)
 */
const sendImageMessage = async (to, imageBuffer, caption) => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.whatsappEnabled || !settings.whatsappApiKey || !settings.whatsappPhoneId) {
      console.log('WhatsApp not configured for media');
      return { success: false, error: 'WhatsApp settings missing' };
    }

    // 1. Upload Media
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'receipt.png', contentType: 'image/png' });
    formData.append('messaging_product', 'whatsapp');

    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v17.0/${settings.whatsappPhoneId}/media`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${settings.whatsappApiKey}`,
          ...formData.getHeaders()
        }
      }
    );

    const mediaId = uploadResponse.data.id;

    // 2. Send Message with Media ID
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${settings.whatsappPhoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          id: mediaId,
          caption: caption
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.whatsappApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.messages) {
      return { success: true, messageId: response.data.messages[0].id };
    }
    return { success: false, error: 'No message ID returned' };

  } catch (error) {
    console.error('WhatsApp Media Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

module.exports = {
  sendWhatsAppReceipt: async (customer, payment, receiptPath, isBuffer = false) => {
    try {
      if (!customer.phoneNumber) {
        return { success: false, message: 'Customer has no phone number' };
      }

      // Format phone number (remove + and spaces, ensure country code)
      let phone = customer.phoneNumber.replace(/[^0-9]/g, '');
      if (phone.length === 10) phone = '91' + phone; // Default to India if 10 digits

      const settings = await Settings.getSettings();
      
      // Determine if dealing with Buffer (from frontend upload) or File Path (backend gen)
      let imageBuffer;
      if (isBuffer) {
        imageBuffer = receiptPath; // receiptPath argument acts as buffer here
      } else if (receiptPath && fs.existsSync(receiptPath)) {
         // It's a file path
         imageBuffer = fs.readFileSync(receiptPath);
      }

      // Try sending image if available
      if (imageBuffer) {
        const caption = `Payment Receipt for ${payment.receiptId}\nAmount: ₹${payment.paidAmount}`;
        const result = await sendImageMessage(phone, imageBuffer, caption);
        if (result.success) {
          return { success: true, status: 'Sent', messageId: result.messageId };
        }
        console.log('Failed to send image, falling back to text...');
      }

      // Fallback to text
      let message = settings.whatsappMessageTemplate || 'Hello {customerName}, Payment of ₹{paidAmount} received.';
      
      // Replace variables
      message = message
        .replace('{customerName}', customer.name)
        .replace('{serviceType}', customer.serviceType || 'Cable')
        .replace('{packageAmount}', payment.billId?.totalPayable || 0)
        .replace('{paidAmount}', payment.paidAmount)
        .replace('{remainingBalance}', payment.remainingBalance)
        .replace('{receiptId}', payment.receiptId)
        .replace('{companyName}', settings.companyName);

      const textResult = await sendViaMetaAPI(phone, message);
      if (textResult.success) {
        return { success: true, status: 'Sent', messageId: textResult.messageId };
      }
      return { success: false, status: 'Failed', message: textResult.error };

    } catch (error) {
      console.error('Send WhatsApp Receipt Error:', error);
      return { success: false, status: 'Failed', message: error.message };
    }
  }
};
