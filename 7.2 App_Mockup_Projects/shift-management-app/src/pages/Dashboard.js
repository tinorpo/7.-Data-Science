import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [shiftExchanges, setShiftExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's shifts
        const shiftsRes = await axios.get('/api/shifts/me');
        
        // Fetch user's shift exchanges
        const exchangesRes = await axios.get('/api/shift-exchanges/me');
        
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
        
        // Get only pending shift exchanges
        const pendingExchanges = exchangesRes.data.filter(exchange => 
          exchange.status === 'pending'
        );
        
        setShifts(upcomingShifts.slice(0, 5)); // Get only the next 5 shifts
        setShiftExchanges(pendingExchanges.slice(0, 5)); // Get only the latest 5 pending exchanges
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Calculate shift duration in hours
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Welcome Message */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">
          Here's an overview of your upcoming shifts and pending shift exchanges.
        </p>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Shifts */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
            <Link to="/shifts" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          
          {shifts.length === 0 ? (
            <p className="text-gray-500">No upcoming shifts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => (
                    <tr key={shift._id}>
                      <td>{new Date(shift.startTime).toLocaleDateString()}</td>
                      <td>
                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>{calculateDuration(shift.startTime, shift.endTime)} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pending Shift Exchanges */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pending Shift Exchanges</h2>
            <Link to="/shift-exchanges" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          
          {shiftExchanges.length === 0 ? (
            <p className="text-gray-500">No pending shift exchanges found.</p>
          ) : (
            <div className="space-y-4">
              {shiftExchanges.map((exchange) => (
                <div key={exchange._id} className="border rounded p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      {exchange.requestingUser._id === user?._id ? 'You' : exchange.requestingUser.name} 
                      {' → '} 
                      {exchange.requestedUser._id === user?._id ? 'You' : exchange.requestedUser.name}
                    </span>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Your Shift:</strong> {formatDate(exchange.requestingUser._id === user?._id ? exchange.requestingShift.startTime : exchange.requestedShift.startTime)}
                    </p>
                    <p>
                      <strong>Their Shift:</strong> {formatDate(exchange.requestingUser._id === user?._id ? exchange.requestedShift.startTime : exchange.requestingShift.startTime)}
                    </p>
                    <p className="mt-2">
                      <strong>Reason:</strong> {exchange.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/shifts" className="btn btn-primary">
            View My Shifts
          </Link>
          <Link to="/shift-exchanges" className="btn btn-primary">
            Manage Shift Exchanges
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
