import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '../store/slices/ordersSlice';

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(state => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  // Safe format for currency - handles undefined or null values
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
  };

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!currentOrder) {
    return <div className="not-found">Order not found</div>;
  }

  return (
    <div className="order-detail-page container">
      <div className="page-header">
        <Link to="/orders" className="back-link">
          &larr; Back to Orders
        </Link>
        <h1>Order #{currentOrder.orderNumber || 'N/A'}</h1>
        <span className={`order-status status-${(currentOrder.status || 'pending').toLowerCase()}`}>
          {currentOrder.status || 'Pending'}
        </span>
      </div>

      <div className="order-info">
        <div className="order-date">
          <h3>Order Date</h3>
          <p>{currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        {currentOrder.shippingAddress && (
          <div className="shipping-address">
            <h3>Shipping Address</h3>
            <p>{currentOrder.shippingAddress.street || 'N/A'}</p>
            <p>
              {currentOrder.shippingAddress.city || 'N/A'}, 
              {currentOrder.shippingAddress.state || 'N/A'} 
              {currentOrder.shippingAddress.zipCode || 'N/A'}
            </p>
            <p>{currentOrder.shippingAddress.country || 'N/A'}</p>
          </div>
        )}
      </div>

      <div className="order-items">
        <h2>Order Items</h2>
        <div className="items-list">
          {currentOrder.items && currentOrder.items.map(item => (
            <div key={item.id} className="order-item">
              <div className="item-image">
                <img 
                  src={item.artPicture?.imageUrl || '/placeholder-image.jpg'} 
                  alt={item.artPicture?.title || 'Art Piece'} 
                />
              </div>
              <div className="item-details">
                <h3>{item.artPicture?.title || 'Untitled'}</h3>
                <p className="item-artist">by {item.artPicture?.artistName || 'Unknown Artist'}</p>
                <p className="item-price">{formatCurrency(item.price)}</p>
              </div>
            </div>
          ))}
          {(!currentOrder.items || currentOrder.items.length === 0) && (
            <div className="no-items">No items found in this order.</div>
          )}
        </div>
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(currentOrder.subtotal)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{formatCurrency(currentOrder.shippingCost)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>{formatCurrency(currentOrder.taxAmount)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>{formatCurrency(currentOrder.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 