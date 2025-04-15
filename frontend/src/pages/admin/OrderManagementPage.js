import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';

const OrderManagementPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [localOrders, setLocalOrders] = useState([]);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Update local orders when Redux store updates
  useEffect(() => {
    if (orders) {
      setLocalOrders(orders.map(order => ({ ...order })));
    }
  }, [orders]);

  // Safe format for currency
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
  };

  // Local function to update order status (in production, this would call an API)
  const handleStatusChange = (orderId, newStatus) => {
    // Update local state for immediate UI feedback
    setLocalOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
    
    // In a real app, you would dispatch an action to update the backend
    // dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getFilteredOrders = () => {
    if (!localOrders || localOrders.length === 0) {
      return [];
    }
    
    if (statusFilter === 'all') {
      return localOrders;
    }
    return localOrders.filter(order => (order.status || '').toLowerCase() === statusFilter);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="order-management-page">
      <h1>Order Management</h1>

      <div className="filter-section">
        <div className="status-filter">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : !filteredOrders || filteredOrders.length === 0 ? (
        <div className="no-data">No orders found</div>
      ) : (
        <div className="orders-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className={expandedOrderId === order.id ? 'expanded-row' : ''}>
                    <td>{order.orderNumber || 'N/A'}</td>
                    <td>
                      {order.customer ? 
                        `${order.customer.firstName || ''} ${order.customer.lastName || ''}` : 
                        'Unknown Customer'}
                    </td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <select
                        value={order.status || 'Pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`status-select status-${(order.status || 'pending').toLowerCase()}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => toggleOrderExpand(order.id)}
                      >
                        {expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="order-details-row">
                      <td colSpan="6">
                        <div className="order-details-container">
                          {order.items && order.items.length > 0 ? (
                            <div className="order-items-section">
                              <h3>Order Items</h3>
                              <table className="inner-table">
                                <thead>
                                  <tr>
                                    <th>Item</th>
                                    <th>Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map(item => (
                                    <tr key={item.id}>
                                      <td>
                                        <div className="item-detail">
                                          <img 
                                            src={item.artPicture?.imageUrl || '/placeholder-image.jpg'} 
                                            alt={item.artPicture?.title || 'Art Piece'}
                                            className="item-thumbnail" 
                                          />
                                          <div>
                                            <p className="item-title">{item.artPicture?.title || 'Untitled'}</p>
                                            <p className="item-artist">by {item.artPicture?.artistName || 'Unknown Artist'}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td>{formatCurrency(item.price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div>No items in this order</div>
                          )}
                          
                          {order.customer && (
                            <div className="customer-info-section">
                              <h3>Customer Information</h3>
                              <p><strong>Name:</strong> {order.customer.firstName || ''} {order.customer.lastName || ''}</p>
                              <p><strong>Email:</strong> {order.customer.email || 'N/A'}</p>
                              <p><strong>Phone:</strong> {order.customer.phone || 'N/A'}</p>
                              
                              {order.shippingAddress && (
                                <>
                                  <h3>Shipping Address</h3>
                                  <p>{order.shippingAddress.street || 'N/A'}</p>
                                  <p>
                                    {order.shippingAddress.city || 'N/A'}, 
                                    {order.shippingAddress.state || 'N/A'} 
                                    {order.shippingAddress.zipCode || 'N/A'}
                                  </p>
                                  <p>{order.shippingAddress.country || 'N/A'}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage; 