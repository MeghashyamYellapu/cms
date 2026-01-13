import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Trash2, Edit, Plus, X } from 'lucide-react';

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
    whatsappEnabled: false
  });

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    status: 'Active'
  });

  useEffect(() => {
    fetchSettings();
    if (admin?.role !== 'Admin') {
      fetchAdmins();
    }
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

  const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getAll();
      setAdmins(response.data.data);
    } catch (error) {
      console.error('Fetch admins error:', error);
    }
  };

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
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditAdmin = (adminUser) => {
    setSelectedAdmin(adminUser);
    setAdminForm({
      name: adminUser.name,
      email: adminUser.email,
      password: '',
      role: adminUser.role,
      status: adminUser.status
    });
    setShowAdminModal(true);
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Delete this admin?')) {
      try {
        await adminAPI.delete(id);
        toast.success('Admin deleted');
        fetchAdmins();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const resetAdminForm = () => {
    setSelectedAdmin(null);
    setAdminForm({ name: '', email: '', password: '', role: 'Admin', status: 'Active' });
  };

  const canManageAdmins = ['WebsiteAdmin', 'SuperAdmin'].includes(admin?.role);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Profile Settings</h3>
              <p className="text-sm text-gray-600">Manage your account</p>
            </div>
          </div>
          <div className="space-y-3">
             {/* ... existing profile ... */}
             <div>
               <p className="text-sm text-gray-600">Name</p>
               <p className="font-medium">{admin?.name}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Email</p>
               <p className="font-medium">{admin?.email}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Role</p>
               <span className="badge badge-info">{admin?.role}</span>
             </div>
          </div>
        </div>

        {/* Admin Management (Only for privileged users) */}
        {canManageAdmins && (
          <div className="card md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Admin Management</h3>
                  <p className="text-sm text-gray-600">Create and manage access</p>
                </div>
              </div>
              <button 
                onClick={() => { resetAdminForm(); setShowAdminModal(true); }}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} /> New Admin
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(adm => (
                    <tr key={adm._id}>
                      <td>{adm.name}</td>
                      <td>{adm.email}</td>
                      <td>
                        <span className={`badge ${adm.role === 'WebsiteAdmin' ? 'badge-warning' : adm.role === 'SuperAdmin' ? 'badge-primary' : 'badge-secondary'}`}>
                          {adm.role}
                        </span>
                      </td>
                      <td><span className={`badge ${adm.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{adm.status}</span></td>
                      <td>
                        {/* Logic to show buttons based on hierarchy */}
                        {admin.role === 'WebsiteAdmin' || (admin.role === 'SuperAdmin' && adm.role === 'Admin') ? (
                          <div className="flex gap-2">
                             <button onClick={() => handleEditAdmin(adm)} className="text-blue-600"><Edit size={16}/></button>
                             {adm._id !== admin._id && (
                               <button onClick={() => handleDeleteAdmin(adm._id)} className="text-red-600"><Trash2 size={16}/></button>
                             )}
                          </div>
                        ) : <span className="text-gray-400 text-xs">No Access</span>}
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && <tr><td colSpan="5" className="text-center py-4">No other admins found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              disabled={admin?.role !== 'WebsiteAdmin' && admin?.role !== 'SuperAdmin'}
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
              disabled={admin?.role !== 'WebsiteAdmin' && admin?.role !== 'SuperAdmin'} // Allow WebsiteAdmin too
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
              disabled={admin?.role !== 'WebsiteAdmin' && admin?.role !== 'SuperAdmin'}
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
              disabled={admin?.role !== 'WebsiteAdmin' && admin?.role !== 'SuperAdmin'}
              placeholder="Enter email"
            />
          </div>
          <div className="flex items-end">
            {(admin?.role === 'SuperAdmin' || admin?.role === 'WebsiteAdmin') && (
              <button 
                className="btn btn-primary w-full"
                onClick={updateCompanyInfo}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Information'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
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
