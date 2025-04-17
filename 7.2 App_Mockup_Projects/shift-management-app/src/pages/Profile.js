import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || ''
      });
    }
  }, [user]);

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
      setError(null);
      setSuccess(false);
      
      await updateProfile(formData);
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile Update Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        {error && (
          <div className="alert alert-danger mb-4">{error}</div>
        )}
        
        {success && (
          <div className="alert alert-success mb-4">Profile updated successfully!</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="form-input"
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">Department can only be changed by administrators</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              type="text"
              value={user?.role || ''}
              className="form-input"
              disabled
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Authentication Provider</label>
            <input
              type="text"
              value={user?.authProvider === 'google' ? 'Google' : 'Microsoft'}
              className="form-input"
              disabled
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Notification Preferences</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                className="mr-2"
                defaultChecked
              />
              <label htmlFor="emailNotifications">
                Receive email notifications for shift changes
              </label>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="exchangeNotifications"
                className="mr-2"
                defaultChecked
              />
              <label htmlFor="exchangeNotifications">
                Receive email notifications for shift exchange requests
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Account Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={signOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
              <button
                className="btn btn-danger"
              >
                Delete Account
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Deleting your account will remove all your data from our system. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
