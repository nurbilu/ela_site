import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { logoutUser } from '../../store/slices/authSlice';
import { resetCart } from '../../store/slices/cartSlice';

const Header = () => {
  const { isAuthenticated, isAdmin, user } = useSelector(state => state.auth);
  const { cart } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
    navigate('/');
  };
  
  return (
    <header>
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">Art Gallery</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/gallery">Gallery</Nav.Link>
              
              {isAuthenticated && (
                <>
                  <Nav.Link as={Link} to="/cart">
                    Cart
                    {cart && cart.items && cart.items.length > 0 && (
                      <Badge pill bg="primary" className="ms-1">
                        {cart.items.length}
                      </Badge>
                    )}
                  </Nav.Link>
                  <Nav.Link as={Link} to="/orders">My Orders</Nav.Link>
                  <Nav.Link as={Link} to="/messages">Messages</Nav.Link>
                </>
              )}
              
              {isAdmin && (
                <NavDropdown title="Admin" id="admin-dropdown">
                  <NavDropdown.Item as={Link} to="/admin/dashboard">Dashboard</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/art-pictures">Art Pictures</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/orders">Orders</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/messages">Messages</NavDropdown.Item>
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
                  <Nav.Link as={Link} to="/login">Login</Nav.Link>
                  <Nav.Link as={Link} to="/register">Register</Nav.Link>
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