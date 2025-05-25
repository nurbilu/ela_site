import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { logoutUser } from '../../store/slices/authSlice';
import { resetCart } from '../../store/slices/cartSlice';

const Header = () => {
  const { isAuthenticated, isAdmin, user } = useSelector(state => state.auth);
  const { cart } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  
  // Close menu when route changes
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);
  
  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
    navigate('/');
  };
  
  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <header>
      <Navbar bg="light" expand="lg" className="mb-4" expanded={expanded}>
        <Container>
          <Navbar.Brand as={Link} to="/">Art Gallery</Navbar.Brand>
          
          {/* Custom hamburger menu button */}
          <button 
            className={`hamburger-menu ${expanded ? 'active' : ''}`} 
            onClick={() => setExpanded(!expanded)}
            aria-controls="basic-navbar-nav"
            aria-expanded={expanded}
            aria-label="Toggle navigation"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={isActive('/') ? 'active' : ''}
              >
                Home
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/gallery" 
                className={isActive('/gallery') ? 'active' : ''}
              >
                Gallery
              </Nav.Link>
              
              {isAuthenticated && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/cart" 
                    className={isActive('/cart') ? 'active' : ''}
                  >
                    Cart
                    {cart && cart.items && cart.items.length > 0 && (
                      <Badge pill bg="primary" className="ms-1">
                        {cart.items.length}
                      </Badge>
                    )}
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/orders" 
                    className={isActive('/orders') ? 'active' : ''}
                  >
                    My Orders
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/messages" 
                    className={isActive('/messages') ? 'active' : ''}
                  >
                    Messages
                  </Nav.Link>
                </>
              )}
              
              {isAdmin && (
                <NavDropdown 
                  title="Admin/Superuser" 
                  id="admin-dropdown"
                  active={['/admin/dashboard', '/admin/art-pictures', '/admin/orders', '/admin/messages'].some(path => location.pathname.startsWith(path))}
                >
                  <NavDropdown.Item 
                    as={Link} 
                    to="/admin/dashboard"
                    active={isActive('/admin/dashboard')}
                  >
                    Dashboard
                  </NavDropdown.Item>
                  <NavDropdown.Item 
                    as={Link} 
                    to="/admin/art-pictures"
                    active={isActive('/admin/art-pictures')}
                  >
                    Art Pictures
                  </NavDropdown.Item>
                  <NavDropdown.Item 
                    as={Link} 
                    to="/admin/orders"
                    active={isActive('/admin/orders')}
                  >
                    Orders
                  </NavDropdown.Item>
                  <NavDropdown.Item 
                    as={Link} 
                    to="/admin/messages"
                    active={isActive('/admin/messages')}
                  >
                    Messages
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            
            <Nav>
              {isAuthenticated ? (
                <NavDropdown title={user ? user.username : 'Account'} id="account-dropdown">
                  <NavDropdown.Item disabled>Welcome, {user ? user.username : 'User'}</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/login" 
                    className={isActive('/login') ? 'active' : ''}
                  >
                    Login
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/register"
                    className={isActive('/register') ? 'active' : ''}
                  >
                    Register
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header; 