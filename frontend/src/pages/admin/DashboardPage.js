import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';
import './DashboardPage.css';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const { user } = useSelector(state => state.auth);

  // Fetch orders to calculate dashboard stats
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Calculate dashboard stats from orders
  const getDashboardStats = () => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalArtPictures: 0,
        unreadMessages: 0,
        totalRevenue: 0,
        recentOrders: [],
        ordersByStatus: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        }
      };
    }

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const recentOrders = [...orders].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 5);

    // Group orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = (order.status || 'pending').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    });

    return {
      totalOrders: orders.length,
      totalArtPictures: 0, // This would typically come from another API call
      unreadMessages: 0, // This would typically come from another API call
      totalRevenue,
      recentOrders,
      ordersByStatus
    };
  };

  const dashboardStats = getDashboardStats();

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="dashboard-page">
      <h1>Admin Dashboard</h1>
      <p className="welcome-message">Welcome back, {user?.username || user?.first_name || 'Admin'}!</p>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-value">{dashboardStats?.totalOrders || 0}</div>
          <Link to="/admin/orders" className="stat-link">View Orders</Link>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="stat-value">${dashboardStats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <span className="stat-subtitle">All time earnings</span>
        </div>

        <div className="stat-card">
          <h3>Art Pictures</h3>
          <div className="stat-value">{dashboardStats?.totalArtPictures || 0}</div>
          <Link to="/admin/art-pictures" className="stat-link">Manage Art</Link>
        </div>

        <div className="stat-card">
          <h3>Messages</h3>
          <div className="stat-value">{dashboardStats?.unreadMessages || 0}</div>
          <Link to="/admin/messages" className="stat-link">View Messages</Link>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="status-overview">
        <h2>Orders by Status</h2>
        <div className="status-cards">
          <div className="status-card pending">
            <h4>Pending</h4>
            <div className="status-count">{dashboardStats.ordersByStatus.pending}</div>
          </div>
          <div className="status-card processing">
            <h4>Processing</h4>
            <div className="status-count">{dashboardStats.ordersByStatus.processing}</div>
          </div>
          <div className="status-card shipped">
            <h4>Shipped</h4>
            <div className="status-count">{dashboardStats.ordersByStatus.shipped}</div>
          </div>
          <div className="status-card delivered">
            <h4>Delivered</h4>
            <div className="status-count">{dashboardStats.ordersByStatus.delivered}</div>
          </div>
          <div className="status-card cancelled">
            <h4>Cancelled</h4>
            <div className="status-count">{dashboardStats.ordersByStatus.cancelled}</div>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Orders</h2>
        {dashboardStats?.recentOrders?.length > 0 ? (
          <div className="recent-list">
            {dashboardStats.recentOrders.map(order => (
              <div key={order.id} className="recent-item">
                <div className="recent-info">
                  <h3>Order #{order.order_number}</h3>
                  <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                  <p><strong>Customer:</strong> {order.user_username || `User ${order.user}`}</p>
                  <p><strong>Email:</strong> {order.user_email || 'N/A'}</p>
                  <p><strong>Total:</strong> ${parseFloat(order.total_price || 0).toFixed(2)}</p>
                </div>
                <div className="recent-status">
                  <span className={`status-badge status-${(order.status || 'pending').toLowerCase()}`}>
                    {order.status || 'Pending'}
                  </span>
                  <Link to={`/admin/orders`} className="view-order-link">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No recent orders</p>
        )}
        <Link to="/admin/orders" className="view-all-link">View All Orders</Link>
      </div>
    </div>
  );
};

export default DashboardPage; 