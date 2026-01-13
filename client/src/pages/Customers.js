import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit,
  Trash2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    area: '',
    serviceType: '',
    status: ''
  });
  const [areas, setAreas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [uploadResult, setUploadResult] = useState(null);
  const [showUploadResultModal, setShowUploadResultModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchAreas();
  }, [filters, pagination.page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll({
        page: pagination.page,
        limit: 10,
        ...filters
      });
      setCustomers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch customers error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await customerAPI.getAreas();
      setAreas(response.data.data);
    } catch (error) {
      console.error('Fetch areas error:', error);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      phoneNumber: '',
      aadhaarNumber: '',
      address: '',
      area: '',
      serviceType: 'SDV',
      setTopBoxId: '',
      cafId: '',
      packageAmount: '',
      previousBalance: 0,
      status: 'Active',
      whatsappEnabled: true
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      phoneNumber: Yup.string()
        .matches(/^[6-9]\d{9}$/, 'Invalid phone number')
        .required('Phone number is required'),
      aadhaarNumber: Yup.string()
        .matches(/^\d{12}$/, 'Aadhaar must be 12 digits')
        .required('Aadhaar is required'),
      address: Yup.string().required('Address is required'),
      area: Yup.string().required('Area is required'),
      serviceType: Yup.string().required('Service type is required'),
      packageAmount: Yup.number()
        .min(0, 'Amount must be positive')
        .required('Package amount is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        if (selectedCustomer) {
          await customerAPI.update(selectedCustomer._id, values);
          toast.success('Customer updated successfully');
        } else {
          await customerAPI.create(values);
          toast.success('Customer created successfully');
        }
        resetForm();
        setShowAddModal(false);
        setSelectedCustomer(null);
        fetchCustomers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    }
  });

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    formik.setValues({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      aadhaarNumber: '', // Don't show encrypted aadhaar
      address: customer.address,
      area: customer.area,
      serviceType: customer.serviceType,
      setTopBoxId: customer.setTopBoxId || '',
      cafId: customer.cafId || '',
      packageAmount: customer.packageAmount,
      previousBalance: customer.previousBalance,
      status: customer.status,
      whatsappEnabled: customer.whatsappEnabled
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await customerAPI.bulkUpload(formData);
      setUploadResult(response.data.data);
      setShowUploadResultModal(true);
      setShowBulkModal(false);
      fetchCustomers();
      e.target.value = null; // Reset input
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload size={20} />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              formik.resetForm();
              setShowAddModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="input"
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
          >
            <option value="">All Areas</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.serviceType}
            onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
          >
            <option value="">All Services</option>
            <option value="SDV">SDV</option>
            <option value="APSFL">APSFL</option>
            <option value="RailWire">RailWire</option>
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users size={48} className="mb-4" />
            <p className="text-lg">No customers found</p>
            <p className="text-sm">Add your first customer to get started</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Area</th>
                    <th>Service</th>
                    <th>Package</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="font-medium">{customer.customerId}</td>
                      <td>{customer.name}</td>
                      <td>{customer.phoneNumber}</td>
                      <td>{customer.area}</td>
                      <td>
                        <span className="badge badge-info">{customer.serviceType}</span>
                      </td>
                      <td>₹{customer.packageAmount}</td>
                      <td className={customer.previousBalance > 0 ? 'text-red-600 font-medium' : ''}>
                        ₹{customer.previousBalance}
                      </td>
                      <td>
                        <span className={`badge ${customer.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {customers.length} of {pagination.total} customers
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCustomer(null);
                  formik.resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...formik.getFieldProps('name')}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="9876543210"
                    {...formik.getFieldProps('phoneNumber')}
                  />
                  {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number * {selectedCustomer && '(Leave blank to keep existing)'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123456789012"
                    {...formik.getFieldProps('aadhaarNumber')}
                  />
                  {formik.touched.aadhaarNumber && formik.errors.aadhaarNumber && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.aadhaarNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...formik.getFieldProps('area')}
                  />
                  {formik.touched.area && formik.errors.area && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.area}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    className="input"
                    rows="2"
                    {...formik.getFieldProps('address')}
                  />
                  {formik.touched.address && formik.errors.address && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select className="input" {...formik.getFieldProps('serviceType')}>
                    <option value="SDV">SDV</option>
                    <option value="APSFL">APSFL</option>
                    <option value="RailWire">RailWire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Amount *
                  </label>
                  <input
                    type="number"
                    className="input"
                    {...formik.getFieldProps('packageAmount')}
                  />
                  {formik.touched.packageAmount && formik.errors.packageAmount && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.packageAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set-Top Box ID
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...formik.getFieldProps('setTopBoxId')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAF ID
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...formik.getFieldProps('cafId')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Balance
                  </label>
                  <input
                    type="number"
                    className="input"
                    {...formik.getFieldProps('previousBalance')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="input" {...formik.getFieldProps('status')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="whatsappEnabled"
                    className="mr-2"
                    {...formik.getFieldProps('whatsappEnabled')}
                    checked={formik.values.whatsappEnabled}
                  />
                  <label htmlFor="whatsappEnabled" className="text-sm font-medium text-gray-700">
                    Enable WhatsApp Receipts
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'Saving...' : (selectedCustomer ? 'Update Customer' : 'Add Customer')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCustomer(null);
                    formik.resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Bulk Upload Customers</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Upload an Excel file (.xlsx or .csv) with customer data.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <label className="btn btn-primary cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkUpload}
                  />
                  Choose File
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📋 Required Columns:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• name, phoneNumber, aadhaarNumber (optional)</li>
                  <li>• address (optional), area, serviceType</li>
                  <li>• packageAmount (optional)</li>
                </ul>
              </div>

              <a
                href="/excel-template.xlsx"
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Template
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result Modal */}
      {showUploadResultModal && uploadResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold">Upload Results</h2>
              <button
                onClick={() => setShowUploadResultModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card bg-green-50 border-green-200">
                   <h3 className="font-bold text-green-800 text-lg">{uploadResult.success.length}</h3>
                   <p className="text-green-600">Successful</p>
                </div>
                <div className="card bg-red-50 border-red-200">
                   <h3 className="font-bold text-red-800 text-lg">{uploadResult.errors.length}</h3>
                   <p className="text-red-600">Failed</p>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 text-red-700">Error Details</h3>
                  <div className="table-container bg-white border rounded-lg">
                    <table className="table w-full text-sm">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-2">Row</th>
                          <th className="px-4 py-2">Errors</th>
                          <th className="px-4 py-2">Data Provided</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.errors.map((err, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 font-medium">#{err.row}</td>
                            <td className="px-4 py-2 text-red-600">
                              <ul className="list-disc pl-4">
                                {err.errors.map((e, i) => <li key={i}>{e}</li>)}
                              </ul>
                            </td>
                            <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                              {JSON.stringify(err.data).substring(0, 100)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowUploadResultModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
