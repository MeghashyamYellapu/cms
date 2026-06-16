import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { History, CheckCircle, XCircle, FileSpreadsheet, X, ChevronLeft, ChevronRight, User } from 'lucide-react';

const BulkUploadHistory = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [selectedUpload, setSelectedUpload] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('errors');

  useEffect(() => {
    fetchUploads(page);
  }, [page]);

  const fetchUploads = async (pageNum) => {
    try {
      setLoading(true);
      const response = await customerAPI.getBulkUploads({ page: pageNum, limit: 20 });
      setUploads(response.data.data);
      setPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Fetch bulk upload history error:', error);
      toast.error('Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (uploadId) => {
    try {
      setLoadingDetail(true);
      const response = await customerAPI.getBulkUploadDetail(uploadId);
      setSelectedUpload(response.data.data);
      setActiveTab(response.data.data.errorCount > 0 ? 'errors' : 'success');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load upload details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <History size={28} className="text-indigo-600" />
          Bulk Upload History
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Review every bulk upload — which customers were added and why others failed
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="loading h-8 w-8"></div>
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileSpreadsheet size={48} className="mb-4" />
            <p className="text-lg">No bulk uploads yet</p>
            <p className="text-sm">Uploads from the Customers page will show up here</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload._id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 cursor-pointer"
                  onClick={() => handleViewDetail(upload._id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{upload.fileName}</p>
                      <p className="text-xs text-gray-500">{formatDate(upload.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      By {upload.uploadedBy?.name || 'Unknown'} • {upload.totalRows} rows
                    </p>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        <CheckCircle size={12} /> {upload.successCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        <XCircle size={12} /> {upload.errorCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="table min-w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Total Rows</th>
                    <th>Successful</th>
                    <th>Failed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr key={upload._id}>
                      <td>{formatDate(upload.createdAt)}</td>
                      <td className="font-medium">{upload.fileName}</td>
                      <td>{upload.uploadedBy?.name || 'Unknown'}</td>
                      <td>{upload.totalRows}</td>
                      <td>
                        <span className="flex items-center gap-1 text-green-700 font-medium">
                          <CheckCircle size={16} /> {upload.successCount}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-red-700 font-medium">
                          <XCircle size={16} /> {upload.errorCount}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewDetail(upload._id)}
                          className="btn btn-secondary text-sm py-1.5 px-3"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600">Page {page} of {pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {(selectedUpload || loadingDetail) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-xl max-w-3xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-6 border-b flex items-center justify-between bg-white md:rounded-t-xl">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Upload Details</h2>
                {selectedUpload && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedUpload.fileName} • {formatDate(selectedUpload.createdAt)} • By {selectedUpload.uploadedBy?.name || 'Unknown'}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setSelectedUpload(null); }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={24} />
              </button>
            </div>

            {loadingDetail && !selectedUpload ? (
              <div className="flex justify-center p-12">
                <div className="loading h-8 w-8"></div>
              </div>
            ) : (
              <>
                <div className="p-4 md:p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="card bg-gray-50 border-gray-200 text-center py-3">
                      <h3 className="font-bold text-gray-800 text-lg">{selectedUpload.totalRows}</h3>
                      <p className="text-gray-500 text-sm">Total Rows</p>
                    </div>
                    <div className="card bg-green-50 border-green-200 text-center py-3">
                      <h3 className="font-bold text-green-800 text-lg">{selectedUpload.successCount}</h3>
                      <p className="text-green-600 text-sm">Successful</p>
                    </div>
                    <div className="card bg-red-50 border-red-200 text-center py-3">
                      <h3 className="font-bold text-red-800 text-lg">{selectedUpload.errorCount}</h3>
                      <p className="text-red-600 text-sm">Failed</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('errors')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'errors'
                          ? 'border-red-600 text-red-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Failed ({selectedUpload.errorCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('success')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'success'
                          ? 'border-green-600 text-green-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Successful ({selectedUpload.successCount})
                    </button>
                  </div>

                  {activeTab === 'errors' && (
                    selectedUpload.errorDetails.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">No failed rows in this upload.</p>
                    ) : (
                      <div className="table-container bg-white border rounded-lg overflow-x-auto">
                        <table className="table w-full text-sm">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-4 py-2">Row</th>
                              <th className="px-4 py-2">Reason(s)</th>
                              <th className="px-4 py-2">Data Provided</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUpload.errorDetails.map((err, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">#{err.row}</td>
                                <td className="px-4 py-2 text-red-600">
                                  <ul className="list-disc pl-4">
                                    {err.errors.map((e, i) => <li key={i}>{e}</li>)}
                                  </ul>
                                </td>
                                <td className="px-4 py-2 text-gray-500 font-mono text-xs max-w-xs truncate">
                                  {JSON.stringify(err.data)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {activeTab === 'success' && (
                    selectedUpload.successDetails.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">No customers were added in this upload.</p>
                    ) : (
                      <div className="table-container bg-white border rounded-lg overflow-x-auto">
                        <table className="table w-full text-sm">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-4 py-2">Row</th>
                              <th className="px-4 py-2">Customer ID</th>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Phone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUpload.successDetails.map((s, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">#{s.row}</td>
                                <td className="px-4 py-2">{s.customerId}</td>
                                <td className="px-4 py-2 flex items-center gap-1.5">
                                  <User size={14} className="text-gray-400" /> {s.name}
                                </td>
                                <td className="px-4 py-2">{s.phoneNumber}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>

                <div className="p-4 md:p-6 border-t bg-gray-50 md:rounded-b-xl flex justify-end">
                  <button onClick={() => setSelectedUpload(null)} className="btn btn-primary">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadHistory;
