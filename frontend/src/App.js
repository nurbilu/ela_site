import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import ArtPictureDetailPage from './pages/ArtPictureDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import MessagesPage from './pages/MessagesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import ArtPictureManagementPage from './pages/admin/ArtPictureManagementPage';
import OrderManagementPage from './pages/admin/OrderManagementPage';
import MessageManagementPage from './pages/admin/MessageManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/layout/Layout';
import AdminRoute from './components/auth/AdminRoute';
import PrivateRoute from './components/auth/PrivateRoute';
import { checkAuthStatus } from './store/slices/authSlice';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Check if the user is still authenticated on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);
  
  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="art/:id" element={<ArtPictureDetailPage />} />
        <Route path="login" element={
          user ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="register" element={
          user ? <Navigate to="/" replace /> : <RegisterPage />
        } />
        
        {/* Private Routes */}
        <Route path="cart" element={
          <PrivateRoute>
            <CartPage />
          </PrivateRoute>
        } />
        <Route path="checkout" element={
          <PrivateRoute>
            <CheckoutPage />
          </PrivateRoute>
        } />
        <Route path="orders" element={
          <PrivateRoute>
            <OrdersPage />
          </PrivateRoute>
        } />
        <Route path="orders/:id" element={
          <PrivateRoute>
            <OrderDetailPage />
          </PrivateRoute>
        } />
        <Route path="messages" element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin/dashboard" element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        } />
        <Route path="admin/art-pictures" element={
          <AdminRoute>
            <ArtPictureManagementPage />
          </AdminRoute>
        } />
        <Route path="admin/orders" element={
          <AdminRoute>
            <OrderManagementPage />
          </AdminRoute>
        } />
        <Route path="admin/messages" element={
          <AdminRoute>
            <MessageManagementPage />
          </AdminRoute>
        } />
        
        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App; 