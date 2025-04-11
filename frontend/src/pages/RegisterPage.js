import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { registerUser, clearError } from '../store/slices/authSlice';

const RegisterPage = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  
  const { loading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!userData.username) {
      errors.username = 'Username is required';
    }
    
    if (!userData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!userData.password) {
      errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Remove confirmPassword before sending
    const { confirmPassword, ...registrationData } = userData;
    
    dispatch(registerUser(registrationData))
      .unwrap()
      .then(() => {
        navigate('/');
      })
      .catch(err => {
        console.error('Registration failed:', err);
      });
  };
  
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <div className="form-container mt-5">
            <h2 className="text-center mb-4">Register</h2>
            
            {error && (
              <Alert variant="danger">
                {typeof error === 'object' ? 
                  Object.values(error).flat().join(' ') : 
                  error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="first_name">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={userData.first_name}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="last_name">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={userData.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Username*</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  isInvalid={!!validationErrors.username}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.username}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email*</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  isInvalid={!!validationErrors.email}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password*</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  isInvalid={!!validationErrors.password}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirm Password*</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={userData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  isInvalid={!!validationErrors.confirmPassword}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </Form>
            
            <div className="text-center mt-3">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage; 