import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders, deleteOrder, updateOrderStatus, restoreOrder } from '../../store/slices/ordersSlice';
import './OrderManagementPage.css';

const OrderManagementPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [localOrders, setLocalOrders] = useState([]);
  
  // New state for admin features
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [removedOrders, setRemovedOrders] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showConfirmBulkRemove, setShowConfirmBulkRemove] = useState(false);
  const [showUndoSection, setShowUndoSection] = useState(false);
  
  // New state for sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

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

  // Local function to update order status (now calls backend API)
  const handleStatusChange = (orderId, newStatus) => {
    // Update local state for immediate UI feedback
    setLocalOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
    
    // Dispatch action to update backend
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  // New admin functions
  const handleSelectOrder = (orderId) => {
    const newSelectedOrders = new Set(selectedOrders);
    if (newSelectedOrders.has(orderId)) {
      newSelectedOrders.delete(orderId);
    } else {
      newSelectedOrders.add(orderId);
    }
    setSelectedOrders(newSelectedOrders);
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const handleRemoveOrder = async (orderId) => {
    const orderToRemove = localOrders.find(order => order.id === orderId);
    if (orderToRemove) {
      try {
        // Store order for undo functionality before removing
        setRemovedOrders(prev => [...prev, { ...orderToRemove, removedAt: new Date() }]);
        
        // Remove from local state immediately for better UX
        setLocalOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Remove from selected orders
        const newSelectedOrders = new Set(selectedOrders);
        newSelectedOrders.delete(orderId);
        setSelectedOrders(newSelectedOrders);
        
        // Delete from backend database
        await dispatch(deleteOrder(orderId)).unwrap();
        
        console.log(`Order ${orderId} successfully removed from database`);
        
      } catch (error) {
        console.error('Failed to delete order from backend:', error);
        
        // If backend deletion fails, restore the order to local state
        setLocalOrders(prev => [...prev, orderToRemove]);
        setRemovedOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Show error message to user
        alert(`Failed to remove order: ${error.message || error}`);
      }
    }
  };

  const handleBulkRemoveOrders = async () => {
    const ordersToRemove = localOrders.filter(order => selectedOrders.has(order.id));
    if (ordersToRemove.length > 0) {
      try {
        // Store orders for undo functionality
        setRemovedOrders(prev => [
          ...prev, 
          ...ordersToRemove.map(order => ({ ...order, removedAt: new Date() }))
        ]);
        
        // Remove from local state immediately
        setLocalOrders(prev => prev.filter(order => !selectedOrders.has(order.id)));
        setSelectedOrders(new Set());
        setShowConfirmBulkRemove(false);
        
        // Delete all selected orders from backend
        const deletePromises = ordersToRemove.map(order => 
          dispatch(deleteOrder(order.id)).unwrap()
        );
        
        await Promise.all(deletePromises);
        console.log(`Successfully removed ${ordersToRemove.length} orders from database`);
        
      } catch (error) {
        console.error('Failed to delete some orders from backend:', error);
        
        // If any deletions fail, restore all orders to local state
        setLocalOrders(prev => [...prev, ...ordersToRemove]);
        setRemovedOrders(prev => prev.filter(order => 
          !ordersToRemove.some(removed => removed.id === order.id)
        ));
        
        alert(`Failed to remove some orders: ${error.message || error}`);
      }
    }
  };

  const handleUndoRemoveOrder = async (orderId) => {
    const orderToRestore = removedOrders.find(order => order.id === orderId);
    if (orderToRestore) {
      try {
        // Remove the removedAt timestamp and prepare for restoration
        // eslint-disable-next-line no-unused-vars
        const { removedAt, id, ...restOrderData } = orderToRestore;
        
        // Create proper order data structure for backend
        const restoreData = {
          user: orderToRestore.user,
          shipping_address: orderToRestore.shipping_address,
          billing_address: orderToRestore.billing_address,
          shipping_address_data: orderToRestore.shipping_address_structured || {
            street: '',
            city: '',
            state: '',
            zipcode: '',
            country: 'United States'
          },
          billing_address_data: orderToRestore.billing_address_structured || {
            street: '',
            city: '',
            state: '',
            zipcode: '',
            country: 'United States'
          },
          payment_method: orderToRestore.payment_method || 'credit_card',
          total_price: orderToRestore.total_price || 0,
          status: orderToRestore.status || 'pending',
          items: orderToRestore.items?.map(item => ({
            art_picture_id: item.art_picture?.id,
            quantity: item.quantity || 1,
            price: item.price || 0
          })) || []
        };
        
        console.log('Restoring order with data:', restoreData);
        
        // Restore to database first
        const restoredOrder = await dispatch(restoreOrder(restoreData)).unwrap();
        
        // Remove from removed orders list only after successful restoration
        setRemovedOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Reload orders to get the updated list with the restored order
        dispatch(fetchOrders());
        
        console.log('Order successfully restored to database:', restoredOrder);
        
      } catch (error) {
        console.error('Failed to restore order to database:', error);
        
        // For fallback, restore to local state only
        const { removedAt, ...restoredOrder } = orderToRestore;
        setLocalOrders(prev => [...prev, restoredOrder]);
        setRemovedOrders(prev => prev.filter(order => order.id !== orderId));
        
        console.log('Order restored to local state as fallback');
        alert(`Warning: Order restored locally but may not be saved to database. Error: ${error.message || error}`);
      }
    }
  };

  const handleClearAllRemoved = () => {
    setRemovedOrders([]);
  };

  const handleReloadOrders = () => {
    dispatch(fetchOrders());
    setSelectedOrders(new Set());
    setRemovedOrders([]);
    setShowUndoSection(false);
  };

  const handleUserSelection = (userId) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  const handleSelectAllUsers = () => {
    const allUserIds = [...new Set(localOrders.map(order => order.user))];
    if (selectedUsers.size === allUserIds.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(allUserIds));
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // New sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending direction
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort indicator for table headers
  const getSortIndicator = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getFilteredOrders = () => {
    if (!localOrders || localOrders.length === 0) {
      return [];
    }
    
    let filtered = localOrders;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => (order.status || '').toLowerCase() === statusFilter);
    }
    
    // Filter by user selection
    if (userFilter !== 'all' && selectedUsers.size > 0) {
      filtered = filtered.filter(order => {
        const userId = order.user;
        return selectedUsers.has(userId);
      });
    }
    
    // Sort the filtered orders
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'order_number':
          aValue = a.order_number || a.orderNumber || '';
          bValue = b.order_number || b.orderNumber || '';
          break;
        case 'total_price':
          aValue = parseFloat(a.total_price || a.total || 0);
          bValue = parseFloat(b.total_price || b.total || 0);
          break;
        case 'status':
          aValue = (a.status || 'pending').toLowerCase();
          bValue = (b.status || 'pending').toLowerCase();
          break;
        case 'user_username':
          aValue = (a.user_username || `User ${a.user}` || '').toLowerCase();
          bValue = (b.user_username || `User ${b.user}` || '').toLowerCase();
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Get unique users for user selection (using actual usernames from database)
  const uniqueUsers = localOrders.reduce((acc, order) => {
    const userId = order.user;
    const userName = order.user_username || `User ${order.user}`;
    if (!acc.find(user => user.id === userId)) {
      acc.push({ id: userId, name: userName });
    }
    return acc;
  }, []);

  // Group orders by username for display (after sorting)
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const userName = order.user_username || `User ${order.user}`;
    if (!groups[userName]) {
      groups[userName] = [];
    }
    groups[userName].push(order);
    return groups;
  }, {});

  return (
    <div className="order-management-page">
      <div className="admin-header">
        <h1>Order Management</h1>
        <div className="admin-actions">
          <Link 
            to="/admin/orders-by-user" 
            className="btn btn-success"
            style={{ textDecoration: 'none', marginRight: '10px' }}
          >
            📊 Orders by User (DB View)
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={handleReloadOrders}
            disabled={loading}
          >
            🔄 Reload Orders
          </button>
          {removedOrders.length > 0 && (
            <button 
              className="btn btn-warning" 
              onClick={() => setShowUndoSection(!showUndoSection)}
            >
              📋 Removed Orders ({removedOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="sorting-section">
        <h4>Sort Orders By:</h4>
        <div className="sort-buttons">
          <button 
            className={`btn btn-sm ${sortField === 'created_at' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleSort('created_at')}
          >
            Date {getSortIndicator('created_at')}
          </button>
          <button 
            className={`btn btn-sm ${sortField === 'order_number' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleSort('order_number')}
          >
            Order # {getSortIndicator('order_number')}
          </button>
          <button 
            className={`btn btn-sm ${sortField === 'total_price' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleSort('total_price')}
          >
            Total {getSortIndicator('total_price')}
          </button>
          <button 
            className={`btn btn-sm ${sortField === 'status' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleSort('status')}
          >
            Status {getSortIndicator('status')}
          </button>
          <button 
            className={`btn btn-sm ${sortField === 'user_username' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleSort('user_username')}
          >
            Customer {getSortIndicator('user_username')}
          </button>
        </div>
        <div className="sort-info">
          <small>Currently sorted by: <strong>{sortField.replace('_', ' ')}</strong> ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})</small>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedOrders.size} orders selected</span>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => setShowConfirmBulkRemove(true)}
          >
            🗑️ Remove Selected
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedOrders(new Set())}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Global Select All */}
      {filteredOrders.length > 0 && (
        <div className="global-actions-bar">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleSelectAllOrders}
          >
            {selectedOrders.size === filteredOrders.length ? '☑️ Deselect All Orders' : '☐ Select All Orders'}
          </button>
          <span className="total-orders-count">Total: {filteredOrders.length} orders</span>
        </div>
      )}

      {/* Bulk Remove Confirmation Modal */}
      {showConfirmBulkRemove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Bulk Removal</h3>
            <p>Are you sure you want to remove {selectedOrders.size} selected orders?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={handleBulkRemoveOrders}
              >
                Yes, Remove
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmBulkRemove(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span>Order #{order.orderNumber || 'N/A'} - {order.user_username || `User ${order.user}`}</span>
                <small>(Removed at {order.removedAt?.toLocaleString()})</small>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleUndoRemoveOrder(order.id)}
                >
                  ↶ Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

        <div className="user-filter">
          <label htmlFor="userFilter">Filter by Users:</label>
          <select
            id="userFilter"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Users</option>
            <option value="selected">Selected Users Only</option>
          </select>
        </div>

        {/* User Selection */}
        <div className="user-selection">
          <h4>Select Users:</h4>
          <div className="user-select-actions">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={handleSelectAllUsers}
            >
              {selectedUsers.size === uniqueUsers.length ? 'Deselect All' : 'Select All'}
            </button>
            <span>{selectedUsers.size} of {uniqueUsers.length} users selected</span>
          </div>
          <div className="user-checkboxes">
            {uniqueUsers.map(user => (
              <label key={user.id} className="user-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => handleUserSelection(user.id)}
                />
                {user.name || `User ${user.id}`}
              </label>
            ))}
          </div>
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
          {Object.keys(groupedOrders).map(userName => (
            <div key={userName} className="user-orders-group">
              <div className="user-group-header">
                <h3>👤 {userName}</h3>
                <span className="order-count">({groupedOrders[userName].length} orders)</span>
              </div>
              <table className="table user-group-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={groupedOrders[userName].every(order => selectedOrders.has(order.id))}
                        onChange={() => {
                          const userOrderIds = groupedOrders[userName].map(order => order.id);
                          const allSelected = userOrderIds.every(id => selectedOrders.has(id));
                          const newSelectedOrders = new Set(selectedOrders);
                          if (allSelected) {
                            userOrderIds.forEach(id => newSelectedOrders.delete(id));
                          } else {
                            userOrderIds.forEach(id => newSelectedOrders.add(id));
                          }
                          setSelectedOrders(newSelectedOrders);
                        }}
                      />
                    </th>
                    <th 
                      className="sortable-header" 
                      onClick={() => handleSort('order_number')}
                      title="Click to sort"
                    >
                      Order # {getSortIndicator('order_number')}
                    </th>
                    <th 
                      className="sortable-header" 
                      onClick={() => handleSort('created_at')}
                      title="Click to sort"
                    >
                      Date {getSortIndicator('created_at')}
                    </th>
                    <th 
                      className="sortable-header" 
                      onClick={() => handleSort('total_price')}
                      title="Click to sort"
                    >
                      Total {getSortIndicator('total_price')}
                    </th>
                    <th 
                      className="sortable-header" 
                      onClick={() => handleSort('status')}
                      title="Click to sort"
                    >
                      Status {getSortIndicator('status')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedOrders[userName].map(order => (
                    <React.Fragment key={order.id}>
                      <tr className={expandedOrderId === order.id ? 'expanded-row' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                          />
                        </td>
                        <td>{order.order_number || order.orderNumber || 'N/A'}</td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A')}</td>
                        <td>{formatCurrency(order.total_price || order.total)}</td>
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
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveOrder(order.id)}
                            style={{ marginLeft: '5px' }}
                          >
                            🗑️ Remove
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
                              
                              {order.user && (
                                <div className="customer-info-section">
                                  <h3>Customer Information</h3>
                                  <p><strong>Name:</strong> {order.user_username || `User ${order.user}`}</p>
                                  <p><strong>Email:</strong> {order.user_email || 'N/A'}</p>
                                  <p><strong>Phone:</strong> {order.user_phone || 'N/A'}</p>
                                  
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
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage; 