import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';

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
        recentOrders: []
      };
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const recentOrders = [...orders].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);

    return {
      totalOrders: orders.length,
      totalArtPictures: 0, // This would typically come from another API call
      unreadMessages: 0, // This would typically come from another API call
      totalRevenue,
      recentOrders
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
      <p className="welcome-message">Welcome back, {user?.firstName || 'Admin'}!</p>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-value">{dashboardStats?.totalOrders || 0}</div>
          <Link to="/admin/orders" className="stat-link">View Orders</Link>
        </div>

        <div className="stat-card">
          <h3>Art Pictures</h3>
          <div className="stat-value">{dashboardStats?.totalArtPictures || 0}</div>
          <Link to="/admin/art-pictures" className="stat-link">Manage Art</Link>
        </div>

        <div className="stat-card">
          <h3>Unread Messages</h3>
          <div className="stat-value">{dashboardStats?.unreadMessages || 0}</div>
          <Link to="/admin/messages" className="stat-link">View Messages</Link>
        </div>

        <div className="stat-card">
          <h3>Revenue</h3>
          <div className="stat-value">${dashboardStats?.totalRevenue?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Orders</h2>
        {dashboardStats?.recentOrders?.length > 0 ? (
          <div className="recent-list">
            {dashboardStats.recentOrders.map(order => (
              <div key={order.id} className="recent-item">
                <div className="recent-info">
                  <h3>Order #{order.orderNumber}</h3>
                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p>Customer: {order.customer.firstName} {order.customer.lastName}</p>
                  <p>Total: ${order.total.toFixed(2)}</p>
                </div>
                <div className="recent-status">
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
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