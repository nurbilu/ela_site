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
        <h1>Order #{currentOrder.orderNumber}</h1>
        <span className={`order-status status-${currentOrder.status.toLowerCase()}`}>
          {currentOrder.status}
        </span>
      </div>

      <div className="order-info">
        <div className="order-date">
          <h3>Order Date</h3>
          <p>{new Date(currentOrder.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="shipping-address">
          <h3>Shipping Address</h3>
          <p>{currentOrder.shippingAddress.street}</p>
          <p>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}</p>
          <p>{currentOrder.shippingAddress.country}</p>
        </div>
      </div>

      <div className="order-items">
        <h2>Order Items</h2>
        <div className="items-list">
          {currentOrder.items.map(item => (
            <div key={item.id} className="order-item">
              <div className="item-image">
                <img src={item.artPicture.imageUrl} alt={item.artPicture.title} />
              </div>
              <div className="item-details">
                <h3>{item.artPicture.title}</h3>
                <p className="item-artist">by {item.artPicture.artistName}</p>
                <p className="item-price">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${currentOrder.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>${currentOrder.shippingCost.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${currentOrder.taxAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${currentOrder.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 