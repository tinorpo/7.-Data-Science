import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    user: '',
    startTime: '',
    endTime: '',
    status: 'scheduled',
    notes: ''
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch shifts
      const shiftsRes = await axios.get('/api/shifts');
      
      // Fetch users
      const usersRes = await axios.get('/api/users');
      
      setShifts(shiftsRes.data);
      setUsers(usersRes.data);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setFormError(null);
      
      // Validate dates
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);
      
      if (endTime <= startTime) {
        setFormError('End time must be after start time');
        setLoading(false);
        return;
      }
      
      if (editingShift) {
        // Update existing shift
        await axios.put(`/api/shifts/${editingShift._id}`, formData);
      } else {
        // Create new shift
        await axios.post('/api/shifts', formData);
      }
      
      // Reset form and fetch updated shifts
      resetForm();
      fetchData();
      
    } catch (err) {
      console.error('Error saving shift:', err);
      setFormError(err.response?.data?.msg || 'Failed to save shift. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    
    // Format dates for datetime-local input
    const formatDateForInput = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };
    
    setFormData({
      user: shift.user._id || shift.user,
      startTime: formatDateForInput(shift.startTime),
      endTime: formatDateForInput(shift.endTime),
      status: shift.status,
      notes: shift.notes || ''
    });
    
    setShowAddForm(true);
  };

  const handleDelete = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.delete(`/api/shifts/${shiftId}`);
      
      // Fetch updated shifts
      fetchData();
      
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError('Failed to delete shift. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user: '',
      startTime: '',
      endTime: '',
      status: 'scheduled',
      notes: ''
    });
    setEditingShift(null);
    setShowAddForm(false);
    setFormError(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate shift duration in hours
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours.toFixed(1);
  };

  // Filter shifts based on filters
  const filteredShifts = shifts.filter(shift => {
    // Filter by user
    const matchesUser = filterUser ? 
      (shift.user._id === filterUser || shift.user === filterUser) : true;
    
    // Filter by status
    const matchesStatus = filterStatus ? shift.status === filterStatus : true;
    
    // Filter by date range
    let matchesDateRange = true;
    
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const shiftDate = new Date(shift.startTime);
      
      if (shiftDate < fromDate) {
        matchesDateRange = false;
      }
    }
    
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      const shiftDate = new Date(shift.startTime);
      
      if (shiftDate > toDate) {
        matchesDateRange = false;
      }
    }
    
    return matchesUser && matchesStatus && matchesDateRange;
  });

  if (loading && shifts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Shifts</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add Shift'}
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      {/* Add/Edit Shift Form */}
      {showAddForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h2>
          
          {formError && (
            <div className="alert alert-danger mb-4">{formError}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select an employee</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.department})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group md:col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                ></textarea>
              </div>
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
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingShift ? 'Update Shift' : 'Add Shift')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Filter by Employee</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="form-input"
            >
              <option value="">All Employees</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>
      
      {/* Shifts Table */}
      {filteredShifts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No shifts found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.map(shift => (
                <tr key={shift._id}>
                  <td>{shift.user.name || 'Unknown'}</td>
                  <td>{new Date(shift.startTime).toLocaleDateString()}</td>
                  <td>
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{calculateDuration(shift.startTime, shift.endTime)} hrs</td>
                  <td>
                    <span className={`badge ${
                      shift.status === 'scheduled' ? 'badge-info' :
                      shift.status === 'completed' ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {shift.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(shift)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(shift._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageShifts;
