import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrdersGroupedByUser } from '../../store/slices/orderUserViewSlice';
import { deleteOrder, restoreOrder } from '../../store/slices/ordersSlice';
import './OrdersByUserPage.css';

const OrdersByUserPage = () => {
  const dispatch = useDispatch();
  const { groupedOrders, loading, error } = useSelector(state => state.orderUserView);
  const [expandedUser, setExpandedUser] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [removedOrders, setRemovedOrders] = useState([]);
  const [showConfirmRemove, setShowConfirmRemove] = useState(null);
  const [showUndoSection, setShowUndoSection] = useState(false);

  useEffect(() => {
    dispatch(fetchOrdersGroupedByUser());
  }, [dispatch]);

  // Safe format for currency
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
  };

  // Filter orders by status
  const filteredGroupedOrders = groupedOrders.map(userGroup => ({
    ...userGroup,
    orders: statusFilter === 'all' 
      ? userGroup.orders 
      : userGroup.orders.filter(order => order.status.toLowerCase() === statusFilter)
  })).filter(userGroup => userGroup.orders.length > 0);

  const toggleUserExpand = (username) => {
    setExpandedUser(expandedUser === username ? null : username);
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': '#ffc107',
      'paid': '#28a745', 
      'processing': '#17a2b8',
      'shipped': '#6f42c1',
      'delivered': '#20c997',
      'cancelled': '#dc3545'
    };
    return statusColors[status?.toLowerCase()] || '#6c757d';
  };

  const getTotalForUser = (orders) => {
    return orders.reduce((total, order) => total + parseFloat(order.total_price || 0), 0);
  };

  // Admin functions for remove and undo
  const handleRemoveOrder = async (order) => {
    setShowConfirmRemove(null);
    try {
      // Add to removed orders list for undo functionality
      setRemovedOrders(prev => [...prev, { ...order, removedAt: new Date() }]);
      
      // Delete from backend
      await dispatch(deleteOrder(order.id)).unwrap();
      
      // Refresh the data
      dispatch(fetchOrdersGroupedByUser());
      
      console.log(`Order ${order.id} successfully removed`);
    } catch (error) {
      console.error('Failed to remove order:', error);
      // Remove from removed orders list if deletion failed
      setRemovedOrders(prev => prev.filter(removedOrder => removedOrder.id !== order.id));
      alert(`Failed to remove order: ${error.message || error}`);
    }
  };

  const handleUndoRemoveOrder = async (order) => {
    try {
      // Prepare restore data
      const restoreData = {
        user: order.user_id,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        shipping_address_data: {
          street: '',
          city: '',
          state: '',
          zipcode: '',
          country: 'United States'
        },
        billing_address_data: {
          street: '',
          city: '',
          state: '',
          zipcode: '',
          country: 'United States'
        },
        payment_method: order.payment_method || 'credit_card',
        total_price: order.total_price || 0,
        status: order.status || 'pending',
        items: [] // Items would need to be restored separately if needed
      };
      
      // Restore to database
      await dispatch(restoreOrder(restoreData)).unwrap();
      
      // Remove from removed orders list
      setRemovedOrders(prev => prev.filter(removedOrder => removedOrder.id !== order.id));
      
      // Refresh the data
      dispatch(fetchOrdersGroupedByUser());
      
      console.log('Order successfully restored');
    } catch (error) {
      console.error('Failed to restore order:', error);
      alert(`Failed to restore order: ${error.message || error}`);
    }
  };

  const handleClearAllRemoved = () => {
    setRemovedOrders([]);
  };

  if (loading) {
    return (
      <div className="orders-by-user-page">
        <div className="loading">Loading orders grouped by user...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-by-user-page">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="orders-by-user-page">
      <div className="page-header">
        <h1>📊 Orders Grouped by User (Admin/Superuser)</h1>
        <p className="page-description">Database view-based order management grouped by user ID - Admin/Superuser access only</p>
        {removedOrders.length > 0 && (
          <div className="removed-orders-indicator">
            <span>🗑️ {removedOrders.length} orders removed</span>
            <button 
              className="btn btn-sm btn-warning"
              onClick={() => setShowUndoSection(!showUndoSection)}
            >
              Show Removed Orders
            </button>
          </div>
        )}
      </div>

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
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{filteredGroupedOrders.length}</div>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-number">
            {filteredGroupedOrders.reduce((total, userGroup) => total + userGroup.orders.length, 0)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="stat-number">
            {formatCurrency(
              filteredGroupedOrders.reduce((total, userGroup) => 
                total + getTotalForUser(userGroup.orders), 0
              )
            )}
          </div>
        </div>
      </div>

      {/* Undo Section */}
      {showUndoSection && removedOrders.length > 0 && (
        <div className="undo-section">
          <h3>Recently Removed Orders</h3>
          <div className="undo-actions">
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleClearAllRemoved}
            >
              Clear All Removed
            </button>
          </div>
          <div className="removed-orders-list">
            {removedOrders.map(order => (
              <div key={order.id} className="removed-order-item">
                <span>Order #{order.order_number?.toString().slice(-8) || 'N/A'} - User ID: {order.user_id}</span>
                <small>(Removed at {order.removedAt?.toLocaleString()})</small>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleUndoRemoveOrder(order)}
                >
                  ↶ Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredGroupedOrders.length === 0 ? (
        <div className="no-data">No orders found for the selected filters</div>
      ) : (
        <div className="users-container">
          {filteredGroupedOrders.map(userGroup => (
            <div key={userGroup.username} className="user-card">
              <div 
                className="user-header"
                onClick={() => toggleUserExpand(userGroup.username)}
              >
                                 <div className="user-info">
                   <h3>
                     👤 User ID: {userGroup.user_info.user_id}
                     <span className="username-badge">@{userGroup.username}</span>
                   </h3>
                   <p className="user-email">{userGroup.user_info.email}</p>
                   <p className="display-name">Display: {userGroup.user_info.display_name}</p>
                 </div>
                <div className="user-stats">
                  <span className="order-count">{userGroup.order_count} orders</span>
                  <span className="user-total">{formatCurrency(getTotalForUser(userGroup.orders))}</span>
                  <span className="expand-icon">
                    {expandedUser === userGroup.username ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedUser === userGroup.username && (
                <div className="user-orders">
                  <table className="orders-table">
                                         <thead>
                       <tr>
                         <th>Order #</th>
                         <th>Date</th>
                         <th>Status</th>
                         <th>Payment Method</th>
                         <th>Total</th>
                         <th>Shipping Address</th>
                         <th>Actions</th>
                       </tr>
                     </thead>
                    <tbody>
                      {userGroup.orders.map(order => (
                        <React.Fragment key={order.id}>
                          <tr className={expandedOrder === order.id ? 'expanded-row' : ''}>
                            <td className="order-number">
                              #{order.order_number?.toString().slice(-8) || 'N/A'}
                            </td>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td>
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(order.status) }}
                              >
                                {order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="payment-method">
                              {order.payment_method === 'credit_card' ? '💳 Credit Card' : 
                               order.payment_method === 'paypal' ? '🅿️ PayPal' : 
                               order.payment_method || 'N/A'}
                            </td>
                                                         <td className="order-total">{formatCurrency(order.total_price)}</td>
                             <td className="shipping-address">
                               {order.shipping_address ? (
                                 <span title={order.shipping_address}>
                                   {order.shipping_address.length > 50 
                                     ? `${order.shipping_address.substring(0, 50)}...` 
                                     : order.shipping_address}
                                 </span>
                               ) : 'N/A'}
                             </td>
                             <td>
                               <button
                                 className="btn btn-sm btn-outline-info"
                                 onClick={() => toggleOrderExpand(order.id)}
                                 style={{ marginRight: '5px' }}
                               >
                                 {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                               </button>
                               <button
                                 className="btn btn-sm btn-outline-danger"
                                 onClick={() => setShowConfirmRemove(order)}
                               >
                                 🗑️ Remove
                               </button>
                             </td>
                          </tr>
                                                     {expandedOrder === order.id && (
                             <tr className="order-details-row">
                               <td colSpan="7">
                                <div className="order-details">
                                  <div className="detail-section">
                                    <h4>📋 Order Information</h4>
                                    <div className="detail-grid">
                                      <div><strong>Order ID:</strong> {order.id}</div>
                                      <div><strong>Payment ID:</strong> {order.payment_id || 'N/A'}</div>
                                      <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
                                      {order.paid_at && (
                                        <div><strong>Paid:</strong> {new Date(order.paid_at).toLocaleString()}</div>
                                      )}
                                    </div>
                                  </div>

                                  {order.shipping_address && (
                                    <div className="detail-section">
                                      <h4>📦 Shipping Address</h4>
                                      <p>{order.shipping_address}</p>
                                    </div>
                                  )}

                                  {order.billing_address && order.billing_address !== order.shipping_address && (
                                    <div className="detail-section">
                                      <h4>💳 Billing Address</h4>
                                      <p>{order.billing_address}</p>
                                    </div>
                                  )}

                                  {order.payment_details && (
                                    <div className="detail-section">
                                      <h4>💰 Payment Details</h4>
                                      <pre className="payment-details">
                                        {JSON.stringify(order.payment_details, null, 2)}
                                      </pre>
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
          ))}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showConfirmRemove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Order Removal</h3>
            <p>Are you sure you want to remove Order #{showConfirmRemove.order_number?.toString().slice(-8) || 'N/A'}?</p>
            <p><strong>User ID:</strong> {showConfirmRemove.user_id}</p>
            <p><strong>Total:</strong> {formatCurrency(showConfirmRemove.total_price)}</p>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={() => handleRemoveOrder(showConfirmRemove)}
              >
                Yes, Remove
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmRemove(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersByUserPage; 