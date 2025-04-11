import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { loginUser, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const { loading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If the user is redirected from another page, this will be the redirect path
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!credentials.username || !credentials.password) {
      return;
    }
    
    dispatch(loginUser(credentials))
      .unwrap()
      .then(() => {
        navigate(from, { replace: true });
      })
      .catch(err => {
        console.error('Login failed:', err);
      });
  };
  
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <div className="form-container mt-5">
            <h2 className="text-center mb-4">Login</h2>
            
            {error && (
              <Alert variant="danger">
                {typeof error === 'object' ? 
                  Object.values(error).flat().join(' ') : 
                  error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </Form.Group>
              
              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form>
            
            <div className="text-center mt-3">
              <p>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage; 