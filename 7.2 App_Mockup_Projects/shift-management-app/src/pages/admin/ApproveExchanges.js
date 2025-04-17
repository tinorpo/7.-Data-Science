import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApproveExchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [responseReason, setResponseReason] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get('/api/shift-exchanges');
      setExchanges(res.data);
      
    } catch (err) {
      console.error('Error fetching shift exchanges:', err);
      setError('Failed to load shift exchanges. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle approve exchange
  const handleApprove = async () => {
    if (!respondingTo) return;
    
    try {
      setLoading(true);
      setFormError(null);
      
      await axios.put(`/api/shift-exchanges/${respondingTo._id}/approve`, {
        responseReason: responseReason || 'Approved by manager'
      });
      
      // Reset form and fetch updated exchanges
      resetForm();
      fetchExchanges();
      
    } catch (err) {
      console.error('Error approving shift exchange:', err);
      setFormError(err.response?.data?.msg || 'Failed to approve shift exchange. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject exchange
  const handleReject = async () => {
    if (!respondingTo) return;
    
    if (!responseReason) {
      setFormError('Please provide a reason for rejection');
      return;
    }
    
    try {
      setLoading(true);
      setFormError(null);
      
      await axios.put(`/api/shift-exchanges/${respondingTo._id}/reject`, {
        responseReason
      });
      
      // Reset form and fetch updated exchanges
      resetForm();
      fetchExchanges();
      
    } catch (err) {
      console.error('Error rejecting shift exchange:', err);
      setFormError(err.response?.data?.msg || 'Failed to reject shift exchange. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete exchange
  const handleDelete = async (exchangeId) => {
    if (!window.confirm('Are you sure you want to delete this exchange request?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.delete(`/api/shift-exchanges/${exchangeId}`);
      
      // Fetch updated exchanges
      fetchExchanges();
      
    } catch (err) {
      console.error('Error deleting shift exchange:', err);
      setError('Failed to delete shift exchange. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openResponseForm = (exchange) => {
    setRespondingTo(exchange);
    setResponseReason('');
    setShowResponseForm(true);
    setFormError(null);
  };

  const resetForm = () => {
    setRespondingTo(null);
    setResponseReason('');
    setShowResponseForm(false);
    setFormError(null);
  };

  // Filter exchanges based on active tab
  const filteredExchanges = exchanges.filter(exchange => {
    if (activeTab === 'pending') {
      return exchange.status === 'pending';
    } else if (activeTab === 'approved') {
      return exchange.status === 'approved';
    } else if (activeTab === 'rejected') {
      return exchange.status === 'rejected';
    } else {
      return true; // All exchanges
    }
  });

  if (loading && exchanges.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Approve Shift Exchanges</h1>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      {/* Response Form */}
      {showResponseForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Respond to Exchange Request
          </h2>
          
          {formError && (
            <div className="alert alert-danger mb-4">{formError}</div>
          )}
          
          <div className="mb-4">
            <p className="font-medium">
              {respondingTo.requestingUser.name} wants to exchange shifts with {respondingTo.requestedUser.name}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Requesting Shift</h4>
                <p>{formatDate(respondingTo.requestingShift.startTime)}</p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Requested Shift</h4>
                <p>{formatDate(respondingTo.requestedShift.startTime)}</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="font-medium mb-1">Reason:</h4>
              <p className="text-gray-600">{respondingTo.reason}</p>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Response Reason</label>
            <textarea
              value={responseReason}
              onChange={(e) => setResponseReason(e.target.value)}
              className="form-input"
              rows="3"
              placeholder="Provide a reason for your decision (required for rejection)"
            ></textarea>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              type="button"
              onClick={resetForm}
              className="btn btn-secondary mr-2"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleReject}
              className="btn btn-danger mr-2"
              disabled={loading}
            >
              Reject
            </button>
            <button 
              type="button"
              onClick={handleApprove}
              className="btn btn-success"
              disabled={loading}
            >
              Approve
            </button>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'pending' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'approved' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'rejected' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected
            </button>
          </li>
          <li>
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'all' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
          </li>
        </ul>
      </div>
      
      {/* Exchange List */}
      {filteredExchanges.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No shift exchanges found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredExchanges.map(exchange => (
            <div key={exchange._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Exchange Request: {exchange.requestingUser.name} ↔ {exchange.requestedUser.name}
                  </h3>
                  <p className="text-gray-600">
                    Requested on {new Date(exchange.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {exchange.status === 'pending' && (
                    <span className="badge badge-warning">Pending</span>
                  )}
                  {exchange.status === 'approved' && (
                    <span className="badge badge-success">Approved</span>
                  )}
                  {exchange.status === 'rejected' && (
                    <span className="badge badge-danger">Rejected</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">
                    {exchange.requestingUser.name}'s Shift
                  </h4>
                  <p className="mb-1">{formatDate(exchange.requestingShift.startTime)}</p>
                  <p className="text-sm text-gray-600">Department: {exchange.requestingUser.department}</p>
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">
                    {exchange.requestedUser.name}'s Shift
                  </h4>
                  <p className="mb-1">{formatDate(exchange.requestedShift.startTime)}</p>
                  <p className="text-sm text-gray-600">Department: {exchange.requestedUser.department}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-1">Reason:</h4>
                <p className="text-gray-600">{exchange.reason}</p>
              </div>
              
              {exchange.status !== 'pending' && (
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Response:</h4>
                  <p className="text-gray-600">{exchange.responseReason}</p>
                  {exchange.approvedBy && (
                    <p className="text-sm text-gray-500 mt-1">
                      Processed by: {exchange.approvedBy.name}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                {exchange.status === 'pending' ? (
                  <button 
                    onClick={() => openResponseForm(exchange)}
                    className="btn btn-primary"
                  >
                    Review Request
                  </button>
                ) : (
                  <button 
                    onClick={() => handleDelete(exchange._id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApproveExchanges;
