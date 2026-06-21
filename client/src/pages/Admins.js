import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Trash2, Edit, Plus, X, Search, UserCog, ChevronLeft, ChevronRight } from 'lucide-react';

const Admins = () => {
  const { admin } = useAuth();
  const isAdminRole = admin?.role === 'Admin';
  const agentsTableRef = useRef(null);
  const adminsTableRef = useRef(null);

  // ── State for WebsiteAdmin / SuperAdmin view ──
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'Admin',
    status: 'Active',
    companyDetails: {}
  });

  // ── State for Admin "My Agents" view ──
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phoneNumber: '', password: '', status: 'Active' });

  useEffect(() => {
    if (isAdminRole) {
      fetchAgents();
    } else {
      fetchAdmins();
    }
  }, [isAdminRole]);

  // ── Agent CRUD ──
  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      const res = await adminAPI.getAgents();
      setAgents(res.data.data);
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setAgentSaving(true);
    try {
      if (selectedAgent) {
        const data = { ...agentForm };
        if (!data.password) delete data.password;
        await adminAPI.updateAgent(selectedAgent._id, data);
        toast.success('Agent updated');
      } else {
        await adminAPI.createAgent(agentForm);
        toast.success('Agent created');
      }
      setShowAgentModal(false);
      resetAgentForm();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setAgentSaving(false);
    }
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Delete this agent? This action cannot be undone.')) {
      try {
        await adminAPI.deleteAgent(id);
        toast.success('Agent deleted');
        fetchAgents();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const resetAgentForm = () => {
    setSelectedAgent(null);
    setAgentForm({ name: '', email: '', phoneNumber: '', password: '', status: 'Active' });
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setAgentForm({ name: agent.name, email: agent.email, phoneNumber: agent.phoneNumber || '', password: '', status: agent.status });
    setShowAgentModal(true);
  };

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
      phoneNumber: adminUser.phoneNumber || '',
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
        phoneNumber: '',
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

  const getRoleBadge = (role) => {
    if (role === 'WebsiteAdmin') return 'badge-warning';
    if (role === 'SuperAdmin') return 'badge-primary';
    return 'badge-info';
  };

  // ── "My Agents" view for Admin role ──
  if (isAdminRole) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Agents</h1>
            <p className="text-gray-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
              Manage your payment collection agents ({agents.length}/2 used)
            </p>
          </div>
          {agents.length < 2 && (
            <button
              onClick={() => { resetAgentForm(); setShowAgentModal(true); }}
              className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus size={20} /> Add Agent
            </button>
          )}
        </div>

        <div className="card">
          {agentsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="spinner"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16">
              <UserCog size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-slate-400 font-medium">No agents yet</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Add up to 2 agents to help collect payments</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {agents.map(agent => (
                  <div key={agent._id} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCog size={18} className="text-violet-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{agent.email}</p>
                        </div>
                      </div>
                      <span className={`badge ${agent.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="badge badge-primary">Agent</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditAgent(agent)} className="icon-btn text-blue-600 hover:bg-blue-50" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteAgent(agent._id)} className="icon-btn text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">

                <div ref={agentsTableRef} style={{overflowX: 'scroll', width: '100%'}}>
                <table className="table w-full" style={{minWidth: '700px'}}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(agent => (
                      <tr key={agent._id}>
                        <td className="font-medium">{agent.name}</td>
                        <td>{agent.email}</td>
                        <td>
                          <span className={`badge ${agent.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {agent.status}
                          </span>
                        </td>
                        <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditAgent(agent)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDeleteAgent(agent._id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Agent Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] flex flex-col animate-slide-up sm:animate-none sm:mx-4">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl sm:rounded-t-xl flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedAgent ? 'Edit Agent' : 'New Agent'}</h2>
                  <p className="text-violet-100 text-xs mt-0.5">
                    {selectedAgent ? 'Update agent details' : 'Create a payment collection agent'}
                  </p>
                </div>
                <button onClick={() => { setShowAgentModal(false); resetAgentForm(); }} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                  <X size={22} />
                </button>
              </div>

              <form id="agentForm" onSubmit={handleAgentSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Full Name *</label>
                  <input className="input" placeholder="e.g. Ravi Kumar" value={agentForm.name}
                    onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Email Address *</label>
                  <input className="input" type="email" placeholder="agent@example.com" value={agentForm.email}
                    onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Phone Number <span className="text-gray-400 font-normal">(optional — for phone login)</span></label>
                  <input className="input" type="tel" placeholder="e.g. 9876543210" maxLength={10}
                    value={agentForm.phoneNumber}
                    onChange={e => setAgentForm({ ...agentForm, phoneNumber: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">
                    Password {selectedAgent && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
                    {!selectedAgent && ' *'}
                  </label>
                  <input className="input" type="password" placeholder={selectedAgent ? '••••••••' : 'Min. 6 characters'}
                    value={agentForm.password} onChange={e => setAgentForm({ ...agentForm, password: e.target.value })}
                    required={!selectedAgent} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Status</label>
                  <select className="input" value={agentForm.status} onChange={e => setAgentForm({ ...agentForm, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </form>

              <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl flex-shrink-0">
                <button type="submit" form="agentForm"
                  className={`btn btn-primary flex-1 py-3 text-base font-semibold ${agentSaving ? 'btn-loading' : ''}`}
                  disabled={agentSaving}>
                  <span>{agentSaving ? 'Saving...' : (selectedAgent ? 'Update Agent' : 'Create Agent')}</span>
                </button>
                <button type="button" onClick={() => { setShowAgentModal(false); resetAgentForm(); }}
                  className="btn btn-secondary px-6 py-3">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Manage Admins</h1>
          <p className="text-gray-600 dark:text-slate-300 mt-1 text-sm sm:text-base">Create and manage admin accounts</p>
        </div>
        <button
          onClick={() => { resetAdminForm(); setShowAdminModal(true); }}
          className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} /> New Admin
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
           <input
             type="text"
             placeholder="Search admins by name or email..."
             className="input pl-10"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {filteredAdmins.length > 0 ? filteredAdmins.map(adm => (
                <div key={adm._id} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{adm.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{adm.email}</p>
                      </div>
                    </div>
                    <span className={`badge ${adm.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {adm.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${getRoleBadge(adm.role)}`}>{adm.role}</span>
                    <div className="flex gap-2">
                      {((canManageRole(adm.role) && adm._id !== admin._id) || admin.role === 'WebsiteAdmin') ? (
                        <>
                          <button onClick={() => handleEditAdmin(adm)} className="icon-btn text-blue-600 hover:bg-blue-50" title="Edit">
                            <Edit size={16}/>
                          </button>
                          {adm._id !== admin._id && (
                            <button onClick={() => handleDeleteAdmin(adm._id)} className="icon-btn text-red-600 hover:bg-red-50" title="Delete">
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500 py-2">
                          {adm._id === admin._id ? 'You' : 'No Access'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No admins found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">

              <div ref={adminsTableRef} style={{overflowX: 'scroll', width: '100%'}}>
              <table className="table w-full" style={{minWidth: '700px'}}>
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
                          <span className={`badge ${getRoleBadge(adm.role)}`}>
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
                          {(canManageRole(adm.role) && adm._id !== admin._id) || (admin.role === 'WebsiteAdmin') ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleEditAdmin(adm)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                <Edit size={18}/>
                              </button>
                              {adm._id !== admin._id && (
                                <button onClick={() => handleDeleteAdmin(adm._id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                                  <Trash2 size={18}/>
                                </button>
                              )}
                            </div>
                          ) : adm._id === admin._id ? (
                            <span className="text-xs text-gray-400 dark:text-slate-500">Current User</span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-slate-500">No Access</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-slate-400">
                        No admins found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-slide-up sm:animate-none sm:mx-4">

            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl sm:rounded-t-xl flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedAdmin ? 'Edit Admin' : 'New Admin'}
                </h2>
                <p className="text-indigo-100 text-xs mt-0.5">
                  {selectedAdmin ? 'Update admin account details' : 'Create a new admin account'}
                </p>
              </div>
              <button
                onClick={() => { setShowAdminModal(false); resetAdminForm(); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable Body */}
            <form id="adminForm" onSubmit={handleAdminSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

              {/* Account Details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Account Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Full Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. John Doe"
                      value={adminForm.name}
                      onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Email Address *</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="admin@example.com"
                      value={adminForm.email}
                      onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Phone Number <span className="text-gray-400 font-normal">(optional — for phone login)</span></label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={adminForm.phoneNumber || ''}
                      onChange={e => setAdminForm({...adminForm, phoneNumber: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">
                      Password {selectedAdmin && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                      {!selectedAdmin && ' *'}
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder={selectedAdmin ? '••••••••' : 'Min. 6 characters'}
                      value={adminForm.password}
                      onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                      required={!selectedAdmin}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Role *</label>
                      <select
                        className="input"
                        value={adminForm.role}
                        onChange={e => setAdminForm({...adminForm, role: e.target.value})}
                      >
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Status *</label>
                      <select
                        className="input"
                        value={adminForm.status}
                        onChange={e => setAdminForm({...adminForm, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Company Information</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Company Name</label>
                    <input
                      className="input"
                      placeholder="e.g. My Cable Services"
                      value={adminForm.companyDetails?.name || ''}
                      onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, name: e.target.value}})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Company Address</label>
                    <textarea
                      className="input resize-none"
                      rows={2}
                      placeholder="Full address"
                      value={adminForm.companyDetails?.address || ''}
                      onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, address: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Phone</label>
                      <input
                        className="input"
                        placeholder="Contact number"
                        value={adminForm.companyDetails?.phone || ''}
                        onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, phone: e.target.value}})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Support Email</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="support@example.com"
                        value={adminForm.companyDetails?.email || ''}
                        onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, email: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">Receipt Footer Message</label>
                    <input
                      className="input"
                      placeholder="e.g. Thank you for your payment!"
                      value={adminForm.companyDetails?.footer || ''}
                      onChange={e => setAdminForm({...adminForm, companyDetails: {...adminForm.companyDetails, footer: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl flex-shrink-0">
              <button
                type="submit"
                form="adminForm"
                className={`btn btn-primary flex-1 py-3 text-base font-semibold ${saving ? 'btn-loading' : ''}`}
                disabled={saving}
              >
                <span>{saving ? 'Saving...' : (selectedAdmin ? 'Update Admin' : 'Create Admin')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowAdminModal(false); resetAdminForm(); }}
                className="btn btn-secondary px-6 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
