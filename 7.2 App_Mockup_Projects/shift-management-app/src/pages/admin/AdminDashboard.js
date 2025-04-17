import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShifts: 0,
    pendingExchanges: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users
        const usersRes = await axios.get('/api/users');
        
        // Fetch shifts
        const shiftsRes = await axios.get('/api/shifts');
        
        // Fetch pending shift exchanges
        const exchangesRes = await axios.get('/api/shift-exchanges/pending');
        
        // Calculate stats
        const totalUsers = usersRes.data.length;
        const totalShifts = shiftsRes.data.length;
        const pendingExchanges = exchangesRes.data.length;
        
        setStats({
          totalUsers,
          totalShifts,
          pendingExchanges
        });
        
        // Get recent users (sorted by creation date, newest first)
        const sortedUsers = [...usersRes.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setRecentUsers(sortedUsers.slice(0, 5));
        
        // Get upcoming shifts (today and future, sorted by start time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredShifts = shiftsRes.data.filter(shift => 
          new Date(shift.startTime) >= today
        );
        
        const sortedShifts = filteredShifts.sort((a, b) => 
          new Date(a.startTime) - new Date(b.startTime)
        );
        
        setUpcomingShifts(sortedShifts.slice(0, 5));
        
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
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
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      {/* Welcome Message */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">
          Here's an overview of your organization's shift management system.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Total Users</h3>
              <p className="text-3xl font-bold text-blue-800">{stats.totalUsers}</p>
            </div>
            <div className="text-blue-500 bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Users →
            </Link>
          </div>
        </div>
        
        <div className="card bg-green-50 border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-green-700">Total Shifts</h3>
              <p className="text-3xl font-bold text-green-800">{stats.totalShifts}</p>
            </div>
            <div className="text-green-500 bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/shifts" className="text-green-600 hover:text-green-800 text-sm font-medium">
              Manage Shifts →
            </Link>
          </div>
        </div>
        
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-yellow-700">Pending Exchanges</h3>
              <p className="text-3xl font-bold text-yellow-800">{stats.pendingExchanges}</p>
            </div>
            <div className="text-yellow-500 bg-yellow-100 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/shift-exchanges" className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
              Review Exchanges →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          
          {recentUsers.length === 0 ? (
            <p className="text-gray-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>
                        <span className={`badge ${
                          user.role === 'admin' ? 'badge-primary' :
                          user.role === 'manager' ? 'badge-info' :
                          'badge-secondary'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.department}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Upcoming Shifts */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
            <Link to="/admin/shifts" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          
          {upcomingShifts.length === 0 ? (
            <p className="text-gray-500">No upcoming shifts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShifts.map(shift => (
                    <tr key={shift._id}>
                      <td>{shift.user.name}</td>
                      <td>{new Date(shift.startTime).toLocaleDateString()}</td>
                      <td>
                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${
                          shift.status === 'scheduled' ? 'badge-info' :
                          shift.status === 'completed' ? 'badge-success' :
                          'badge-danger'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/users" className="btn btn-primary">
            Manage Users
          </Link>
          <Link to="/admin/shifts" className="btn btn-primary">
            Manage Shifts
          </Link>
          <Link to="/admin/shift-exchanges" className="btn btn-primary">
            Review Shift Exchanges
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
