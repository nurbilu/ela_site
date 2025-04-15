import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../store/slices/ordersSlice';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Safe format for currency - handles undefined or null values
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
  };

  if (loading) {
    return <div className="loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="orders-page container">
      <h1>My Orders</h1>
      {!orders || orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <Link to="/gallery" className="btn btn-primary">
            Browse Gallery
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h2>Order #{order.orderNumber || 'N/A'}</h2>
                <span className={`order-status status-${(order.status || 'pending').toLowerCase()}`}>
                  {order.status || 'Pending'}
                </span>
              </div>
              <div className="order-details">
                <p>Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p>Total: {formatCurrency(order.total)}</p>
              </div>
              <Link to={`/orders/${order.id}`} className="btn btn-outline">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 