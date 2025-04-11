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
    if (statusFilter === 'all') {
      return localOrders;
    }
    return localOrders.filter(order => order.status.toLowerCase() === statusFilter);
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
      ) : filteredOrders.length === 0 ? (
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
                    <td>{order.orderNumber}</td>
                    <td>{order.customer.firstName} {order.customer.lastName}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`status-select status-${order.status.toLowerCase()}`}
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
                                          src={item.artPicture.imageUrl} 
                                          alt={item.artPicture.title}
                                          className="item-thumbnail" 
                                        />
                                        <div>
                                          <p className="item-title">{item.artPicture.title}</p>
                                          <p className="item-artist">by {item.artPicture.artistName}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td>${item.price.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="customer-info-section">
                            <h3>Customer Information</h3>
                            <p><strong>Name:</strong> {order.customer.firstName} {order.customer.lastName}</p>
                            <p><strong>Email:</strong> {order.customer.email}</p>
                            <p><strong>Phone:</strong> {order.customer.phone || 'N/A'}</p>
                            
                            <h3>Shipping Address</h3>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
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