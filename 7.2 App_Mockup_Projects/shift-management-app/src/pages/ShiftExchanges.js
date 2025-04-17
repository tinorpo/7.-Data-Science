import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ShiftExchanges = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [shiftExchanges, setShiftExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showNewExchangeForm, setShowNewExchangeForm] = useState(false);
  
  // Form state
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedColleague, setSelectedColleague] = useState('');
  const [selectedColleagueShift, setSelectedColleagueShift] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState(null);
  const [colleagueShifts, setColleagueShifts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's shifts
        const shiftsRes = await axios.get('/api/shifts/me');
        
        // Fetch user's shift exchanges
        const exchangesRes = await axios.get('/api/shift-exchanges/me');
        
        // Fetch colleagues (users with the same role)
        const usersRes = await axios.get('/api/users');
        const filteredColleagues = usersRes.data.filter(
          colleague => colleague._id !== user._id && colleague.role === user.role
        );
        
        // Sort shifts by start time
        const sortedShifts = shiftsRes.data.sort((a, b) => 
          new Date(a.startTime) - new Date(b.startTime)
        );
        
        // Get only upcoming shifts (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingShifts = sortedShifts.filter(shift => 
          new Date(shift.startTime) >= today
        );
        
        setShifts(upcomingShifts);
        setShiftExchanges(exchangesRes.data);
        setColleagues(filteredColleagues);
      } catch (err) {
        console.error('Error fetching shift exchanges data:', err);
        setError('Failed to load shift exchanges data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch colleague's shifts when a colleague is selected
  useEffect(() => {
    const fetchColleagueShifts = async () => {
      if (!selectedColleague) {
        setColleagueShifts([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // In a real app, you would have an endpoint to get shifts by user ID
        // For this mockup, we'll simulate it
        const res = await axios.get('/api/shifts');
        const filteredShifts = res.data.filter(shift => 
          shift.user === selectedColleague
        );
        
        // Get only upcoming shifts
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingShifts = filteredShifts.filter(shift => 
          new Date(shift.startTime) >= today
        );
        
        setColleagueShifts(upcomingShifts);
      } catch (err) {
        console.error('Error fetching colleague shifts:', err);
        setFormError('Failed to load colleague shifts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchColleagueShifts();
  }, [selectedColleague]);

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

  // Handle new exchange request submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShift || !selectedColleague || !selectedColleagueShift || !reason) {
      setFormError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setFormError(null);
      
      const exchangeData = {
        requestedUser: selectedColleague,
        requestingShift: selectedShift,
        requestedShift: selectedColleagueShift,
        reason
      };
      
      const res = await axios.post('/api/shift-exchanges', exchangeData);
      
      // Add the new exchange to the list
      setShiftExchanges([res.data, ...shiftExchanges]);
      
      // Reset form
      setSelectedShift('');
      setSelectedColleague('');
      setSelectedColleagueShift('');
      setReason('');
      setShowNewExchangeForm(false);
      
    } catch (err) {
      console.error('Error creating shift exchange:', err);
      setFormError(err.response?.data?.msg || 'Failed to create shift exchange. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle exchange cancellation
  const handleCancelExchange = async (exchangeId) => {
    try {
      setLoading(true);
      
      await axios.delete(`/api/shift-exchanges/${exchangeId}`);
      
      // Remove the cancelled exchange from the list
      setShiftExchanges(shiftExchanges.filter(exchange => exchange._id !== exchangeId));
      
    } catch (err) {
      console.error('Error cancelling shift exchange:', err);
      setError('Failed to cancel shift exchange. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter exchanges based on active tab
  const filteredExchanges = shiftExchanges.filter(exchange => {
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

  if (loading && shiftExchanges.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shift Exchanges</h1>
        <button 
          onClick={() => setShowNewExchangeForm(!showNewExchangeForm)}
          className="btn btn-primary"
        >
          {showNewExchangeForm ? 'Cancel' : 'New Exchange Request'}
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      {/* New Exchange Form */}
      {showNewExchangeForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">New Shift Exchange Request</h2>
          
          {formError && (
            <div className="alert alert-danger mb-4">{formError}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Your Shift</label>
                <select 
                  className="form-input"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  required
                >
                  <option value="">Select your shift</option>
                  {shifts.map(shift => (
                    <option key={shift._id} value={shift._id}>
                      {formatDate(shift.startTime)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Colleague</label>
                <select 
                  className="form-input"
                  value={selectedColleague}
                  onChange={(e) => setSelectedColleague(e.target.value)}
                  required
                >
                  <option value="">Select a colleague</option>
                  {colleagues.map(colleague => (
                    <option key={colleague._id} value={colleague._id}>
                      {colleague.name} ({colleague.department})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Colleague's Shift</label>
                <select 
                  className="form-input"
                  value={selectedColleagueShift}
                  onChange={(e) => setSelectedColleagueShift(e.target.value)}
                  required
                  disabled={!selectedColleague}
                >
                  <option value="">Select colleague's shift</option>
                  {colleagueShifts.map(shift => (
                    <option key={shift._id} value={shift._id}>
                      {formatDate(shift.startTime)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group md:col-span-2">
                <label className="form-label">Reason for Exchange</label>
                <textarea 
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  required
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                type="button"
                onClick={() => setShowNewExchangeForm(false)}
                className="btn btn-secondary mr-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
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
                    Exchange with {exchange.requestingUser._id === user._id 
                      ? exchange.requestedUser.name 
                      : exchange.requestingUser.name}
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
                    {exchange.requestingUser._id === user._id ? 'Your Shift' : 'Their Shift'}
                  </h4>
                  <p>{formatDate(exchange.requestingShift.startTime)}</p>
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">
                    {exchange.requestedUser._id === user._id ? 'Your Shift' : 'Their Shift'}
                  </h4>
                  <p>{formatDate(exchange.requestedShift.startTime)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-1">Reason:</h4>
                <p className="text-gray-600">{exchange.reason}</p>
              </div>
              
              {exchange.status !== 'pending' && exchange.responseReason && (
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Response:</h4>
                  <p className="text-gray-600">{exchange.responseReason}</p>
                </div>
              )}
              
              {exchange.status === 'pending' && exchange.requestingUser._id === user._id && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleCancelExchange(exchange._id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShiftExchanges;
