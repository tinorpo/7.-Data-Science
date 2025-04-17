import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-6">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <div className="space-x-4">
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-secondary"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
