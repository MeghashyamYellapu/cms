import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Trash2, Edit, Plus, X, Search } from 'lucide-react';

const Admins = () => {
  const { admin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    status: 'Active',
    companyDetails: {}
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAll();
      setAdmins(response.data.data);
    } catch (error) {
      console.error('Fetch admins error:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdmin = (adminUser) => {
    setSelectedAdmin(adminUser);
    setAdminForm({
      name: adminUser.name,
      email: adminUser.email,
      password: '',
      role: adminUser.role,
      status: adminUser.status,
      companyDetails: adminUser.companyDetails || {}
    });
    setShowAdminModal(true);
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Delete this admin? This action cannot be undone.')) {
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
    setAdminForm({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'Admin', 
        status: 'Active',
        companyDetails: {}
    });
  };

  // WebsiteAdmin can manage everyone. SuperAdmin can manage Admins.
  const canManageRole = (targetRole) => {
    if (admin?.role === 'WebsiteAdmin') return true;
    if (admin?.role === 'SuperAdmin' && targetRole === 'Admin') return true;
    return false;
  };

  // Filter admins based on search
  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
          <p className="text-gray-600 mt-1">Create and manage admin accounts</p>
        </div>
        <button 
          onClick={() => { resetAdminForm(); setShowAdminModal(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> New Admin
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-6">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
           <input
             type="text"
             placeholder="Search admins by name or email..."
             className="input pl-10"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map(adm => (
                  <tr key={adm._id}>
                    <td className="font-medium">{adm.name}</td>
                    <td>{adm.email}</td>
                    <td>
                      <span className={`badge ${
                        adm.role === 'WebsiteAdmin' ? 'badge-warning' : 
                        adm.role === 'SuperAdmin' ? 'badge-primary' : 
                        'badge-info'
                      }`}>
                        {adm.role}
                      </span>
                    </td>
                    <td>
                         <span className={`badge ${adm.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {adm.status}
                         </span>
                    </td>
                    <td>{new Date(adm.createdAt).toLocaleDateString()}</td>
                    <td>
                      {/* Check permission regarding specific admin */}
                      {/* Can edit self? Usually yes, but here managing others */}
                      {/* SuperAdmin can edit Admin only. WebsiteAdmin can edit all. */}
                      {(canManageRole(adm.role) && adm._id !== admin._id) || (admin.role === 'WebsiteAdmin') ? (
                         <div className="flex gap-2">
                           <button 
                             onClick={() => handleEditAdmin(adm)} 
                             className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                             title="Edit"
                           >
                             <Edit size={18}/>
                           </button>
                           {adm._id !== admin._id && (
                             <button 
                               onClick={() => handleDeleteAdmin(adm._id)} 
                               className="text-red-600 hover:bg-red-50 p-1 rounded"
                               title="Delete"
                             >
                               <Trash2 size={18}/>
                             </button>
                           )}
                         </div>
                      ) : adm._id === admin._id ? (
                          <span className="text-xs text-gray-400">Current User</span>
                      ) : (
                          <span className="text-xs text-gray-400">No Access</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No admins found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
               
               {/* Company Information Section */}
               <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Company Information (For Billing)</h3>
                  <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <input 
                            className="input" 
                            placeholder="e.g. My Cable Services"
                            value={adminForm.companyDetails?.name || ''} 
                            onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, name: e.target.value}})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Address</label>
                        <input 
                            className="input" 
                            placeholder="Address Line"
                            value={adminForm.companyDetails?.address || ''} 
                            onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, address: e.target.value}})} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input 
                                className="input" 
                                placeholder="Contact No"
                                value={adminForm.companyDetails?.phone || ''} 
                                onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, phone: e.target.value}})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input 
                                className="input" 
                                placeholder="Support Email"
                                value={adminForm.companyDetails?.email || ''} 
                                onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, email: e.target.value}})} 
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Receipt Footer</label>
                        <input 
                            className="input" 
                            placeholder="Thank you message..."
                            value={adminForm.companyDetails?.footer || ''} 
                            onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, footer: e.target.value}})} 
                        />
                    </div>
                  </div>
               </div>

               <button 
                 type="submit" 
                 className={`btn btn-primary w-full mt-6 ${saving ? 'btn-loading' : ''}`}
                 disabled={saving}
               >
                 <span>{saving ? 'Saving...' : 'Save Admin'}</span>
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
