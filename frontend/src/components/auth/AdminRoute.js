import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// AdminRoute protects routes that require admin/superuser access
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default AdminRoute; 