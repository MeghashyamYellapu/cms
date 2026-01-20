import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Bell, X, BellRing, BellOff } from 'lucide-react';
import { isPushSupported, getNotificationPermission, requestNotificationPermission, showLocalNotification } from '../utils/pwa';

const Settings = () => {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    companyPhone: '',
    companyAddress: '',
    companyEmail: '',
    billingDay: 1,
    defaultPackageAmount: 500,
    whatsappEnabled: false,
    upiEnabled: false,
    upiId: ''
  });

  // Admin Management State
  // const [admins, setAdmins] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    status: 'Active'
  });

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (admin?.role !== 'Admin') {
    // fetchAdmins();
    }
    // Check notification support
    setPushSupported(isPushSupported());
    setNotificationPermission(getNotificationPermission());
  }, [admin]);

  const fetchSettings = async () => {
   // ... (existing fetchSettings logic) ...
    try {
      const response = await settingsAPI.get();
      if (response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Failed to load settings');
    }
  };

  /* const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getAll();
      setAdmins(response.data.data);
    } catch (error) {
      console.error('Fetch admins error:', error);
    }
  }; */

  const handleInputChange = (e) => {
    // ... (existing logic) ...
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const updateCompanyInfo = async () => {
    // ... (existing logic) ...
    try {
      setLoading(true);
      await settingsAPI.update({
        companyName: settings.companyName,
        companyPhone: settings.companyPhone,
        companyAddress: settings.companyAddress,
        companyEmail: settings.companyEmail
      });
      toast.success('Company information updated');
    } catch (error) {
      console.error('Update settings error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update settings';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAdmin) {
        // Update
        const data = { ...adminForm };
        if (!data.password) delete data.password; // Don't send empty password
        await adminAPI.update(selectedAdmin._id, data);
        toast.success('Admin updated');
      } else {
        // Create
        await adminAPI.create(adminForm);
        toast.success('Admin created');
      }
      setShowAdminModal(false);
      resetAdminForm();
      // fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  /* const handleEditAdmin = (adminUser) => {
    setSelectedAdmin(adminUser);
    setAdminForm({
      name: adminUser.name,
      email: adminUser.email,
      password: '',
      role: adminUser.role,
      status: adminUser.status
    });
    setShowAdminModal(true);
  }; */

  /* const handleDeleteAdmin = async (id) => {
    if (window.confirm('Delete this admin?')) {
      try {
        await adminAPI.delete(id);
        toast.success('Admin deleted');
        fetchAdmins();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  }; */

  const resetAdminForm = () => {
    setSelectedAdmin(null);
    setAdminForm({ name: '', email: '', password: '', role: 'Admin', status: 'Active' });
  };

  // Handle notification permission toggle
  const handleNotificationToggle = async () => {
    if (notificationPermission === 'granted') {
      toast.error('To disable notifications, please change settings in your browser');
      return;
    }
    
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      toast.success('Notifications enabled!');
      // Send test notification
      await showLocalNotification('Notifications Enabled', {
        body: 'You will now receive payment reminders and updates.',
        tag: 'welcome'
      });
    } else {
      setNotificationPermission(getNotificationPermission());
      toast.error('Notification permission denied');
    }
  };

  const testNotification = async () => {
    const sent = await showLocalNotification('Test Notification', {
      body: 'This is a test notification from Cable CMS.',
      tag: 'test'
    });
    if (sent) {
      toast.success('Test notification sent!');
    }
  };

  // const canManageAdmins = ['WebsiteAdmin', 'SuperAdmin'].includes(admin?.role);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage system configuration</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Profile Settings</h3>
              <p className="text-xs sm:text-sm text-gray-600">Manage your account</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
             <div>
               <p className="text-sm text-gray-600">Name</p>
               <p className="font-medium text-lg">{admin?.name}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Email</p>
               <p className="font-medium text-lg">{admin?.email}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Role</p>
               <span className="badge badge-info">{admin?.role}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Legacy Sections (Company Info etc) */}
      <div className="card">
         {/* ... (keep existing Company Info logic) ... */}
         <h3 className="font-semibold text-lg mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Company Name</label>
            <input 
              type="text" 
              name="companyName"
              className="input" 
              value={settings.companyName}
              onChange={handleInputChange}
              disabled={admin?.role === 'Admin'}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
            <input 
              type="text" 
              name="companyPhone"
              className="input" 
              value={settings.companyPhone}
              onChange={handleInputChange}
              disabled={admin?.role === 'Admin'}
              placeholder="Enter phone number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <textarea 
              name="companyAddress"
              className="input" 
              rows="2" 
              value={settings.companyAddress}
              onChange={handleInputChange}
              disabled={admin?.role === 'Admin'}
              placeholder="Enter address"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input 
              type="email" 
              name="companyEmail"
              className="input" 
              value={settings.companyEmail}
              onChange={handleInputChange}
              disabled={admin?.role === 'Admin'}
              placeholder="Enter email"
            />
          </div>
          <div className="flex items-end">
             {admin?.role !== 'Admin' && (
              <button 
                className={`btn btn-primary w-full ${loading ? 'btn-loading' : ''}`}
                onClick={updateCompanyInfo}
                disabled={loading}
              >
                <span>{loading ? 'Updating...' : 'Update Information'}</span>
              </button>
             )}
          </div>
        </div>
      </div>

      {/* UPI Payment Settings */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">UPI Payment Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enable UPI payments in the customer portal. Customers can pay their outstanding balance via PhonePe, Google Pay, or Paytm.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable UPI Payments</p>
              <p className="text-sm text-gray-500">Allow customers to pay via UPI apps</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="upiEnabled"
                checked={settings.upiEnabled}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {settings.upiEnabled && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                UPI ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="upiId"
                className="input"
                value={settings.upiId}
                onChange={handleInputChange}
                placeholder="yourname@paytm / yourname@ybl / yourname@oksbi"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID (e.g., 9876543210@paytm). This will be used for customer payments.
              </p>
            </div>
          )}

          <button
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              onClick={async () => {
                try {
                  setLoading(true);
                  await settingsAPI.update({
                    upiEnabled: settings.upiEnabled,
                    upiId: settings.upiId
                  });
                  toast.success('UPI settings updated successfully');
                } catch (error) {
                  console.error('Update UPI settings error:', error);
                  toast.error(error.response?.data?.message || 'Failed to update UPI settings');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || (settings.upiEnabled && !settings.upiId)}
            >
              <span>{loading ? 'Updating...' : 'Update UPI Settings'}</span>
            </button>
        </div>
      </div>

      {/* Push Notification Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Push Notifications</h3>
            <p className="text-sm text-gray-600">Receive payment reminders and updates</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {!pushSupported ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                Push notifications are not supported in this browser. For the best experience, 
                please use Chrome, Firefox, or Edge.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {notificationPermission === 'granted' ? (
                    <BellRing className="text-green-600" size={24} />
                  ) : (
                    <BellOff className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium">
                      {notificationPermission === 'granted' ? 'Notifications Enabled' : 'Notifications Disabled'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {notificationPermission === 'granted' 
                        ? 'You will receive payment and billing alerts'
                        : 'Enable to receive important updates'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    notificationPermission === 'granted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
                </button>
              </div>
              
              {notificationPermission === 'granted' && (
                <button
                  onClick={testNotification}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Bell size={18} />
                  Send Test Notification
                </button>
              )}
              
              {notificationPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    Notifications are blocked. Please enable them in your browser settings 
                    (click the lock icon in the address bar).
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-xl max-w-md w-full h-full md:h-auto p-6 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedAdmin ? 'Edit Admin' : 'New Admin'}</h2>
              <button onClick={() => setShowAdminModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input className="input" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} required/>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="input" type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} required/>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Password {selectedAdmin && '(Leave blank to keep)'}</label>
                  <input className="input" type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} required={!selectedAdmin}/>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select className="input" value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})}>
                     {/* Only WebsiteAdmin can create WebsiteAdmin/SuperAdmin */}
                     <option value="Admin">Admin</option>
                     {admin.role === 'WebsiteAdmin' && (
                       <>
                        <option value="SuperAdmin">SuperAdmin</option>
                        <option value="WebsiteAdmin">WebsiteAdmin</option>
                       </>
                     )}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="input" value={adminForm.status} onChange={e => setAdminForm({...adminForm, status: e.target.value})}>
                     <option value="Active">Active</option>
                     <option value="Blocked">Blocked</option>
                  </select>
               </div>
               <button type="submit" className="btn btn-primary w-full">Save Admin</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
