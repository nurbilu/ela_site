import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { fetchCart } from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/ordersSlice';

// Note: Make sure to create a .env file in the frontend directory with:
// REACT_APP_MY_PHONE=your_whatsapp_phone_number (without +, just digits)
// REACT_APP_MY_EMAIL=your_email@domain.com

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { cart, loading: cartLoading, error: cartError } = useSelector(state => state.cart);
  const { currentOrder, loading, error } = useSelector(state => state.orders);
  
  const [checkoutData, setCheckoutData] = useState({
    shipping_address: '',
    billing_address: '',
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
    same_as_shipping: false
  });

  // List of US states for dropdown
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // List of countries for dropdown
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan',
    'China', 'Brazil', 'Mexico', 'Israel', 'India', 'Spain', 'Italy', 'Netherlands', 'South Korea'
  ];
  
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  
  useEffect(() => {
    // If payment successful, redirect to order confirmation
    if (currentOrder) {
      navigate(`/orders/${currentOrder.id}`);
    }
  }, [currentOrder, navigate]);
  
  const handleAddressChange = (addressType, field, value) => {
    setCheckoutData(prev => ({
      ...prev,
      [`${addressType}_data`]: {
        ...prev[`${addressType}_data`],
        [field]: value
      },
      // Also update legacy address field for backward compatibility
      [addressType]: Object.entries({
        ...prev[`${addressType}_data`],
        [field]: value
      })
        .filter(([_, val]) => val)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ')
    }));
    
    // Clear any error for this field
    if (formErrors[`${addressType}_${field}`]) {
      setFormErrors(prev => ({
        ...prev,
        [`${addressType}_${field}`]: null
      }));
    }
  };
  
  const handleSameAsShipping = (e) => {
    const checked = e.target.checked;
    setCheckoutData(prev => ({
      ...prev,
      same_as_shipping: checked,
      billing_address_data: checked ? {...prev.shipping_address_data} : {
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'United States'
      },
      billing_address: checked ? prev.shipping_address : ''
    }));
    
    // Clear billing address errors if using shipping address
    if (checked) {
      const newErrors = {...formErrors};
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('billing_')) {
          delete newErrors[key];
        }
      });
      setFormErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = {};
    const shipping = checkoutData.shipping_address_data;
    const billing = checkoutData.billing_address_data;
    
    // Validate shipping address
    if (!shipping.street.trim()) errors.shipping_street = 'Street address is required';
    if (!shipping.city.trim()) errors.shipping_city = 'City is required';
    if (!shipping.state.trim()) errors.shipping_state = 'State is required';
    if (!shipping.zipcode.trim()) errors.shipping_zipcode = 'Zip code is required';
    else if (!/^\d{5}(-\d{4})?$/.test(shipping.zipcode.trim()) && shipping.country === 'United States') 
      errors.shipping_zipcode = 'Invalid US zip code format';
    
    // Validate billing address only if it's not same as shipping
    if (!checkoutData.same_as_shipping) {
      if (!billing.street.trim()) errors.billing_street = 'Street address is required';
      if (!billing.city.trim()) errors.billing_city = 'City is required';
      if (!billing.state.trim()) errors.billing_state = 'State is required';
      if (!billing.zipcode.trim()) errors.billing_zipcode = 'Zip code is required';
      else if (!/^\d{5}(-\d{4})?$/.test(billing.zipcode.trim()) && billing.country === 'United States') 
        errors.billing_zipcode = 'Invalid US zip code format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate WhatsApp message with parchment receipt
  const generateWhatsAppMessage = () => {
    const orderDate = new Date().toLocaleDateString();
    const orderTime = new Date().toLocaleTimeString();
    
    // Create detailed receipt message
    let message = `Hello! I'm interested in buying this/these art pictures, let's talk about it.\n\n`;
    message += `═══════════════════════════════\n`;
    message += `📜 ART PURCHASE RECEIPT 📜\n`;
    message += `═══════════════════════════════\n\n`;
    message += `📅 Date: ${orderDate}\n`;
    message += `🕐 Time: ${orderTime}\n\n`;
    
    message += `🎨 SELECTED ARTWORKS:\n`;
    message += `─────────────────────────────────\n`;
    
    cart.items.forEach((item, index) => {
      message += `${index + 1}. ${item.art_picture.title}\n`;
      message += `   Quantity: ${item.quantity}\n`;
      message += `   Price per item: $${item.art_picture.price}\n`;
      message += `   Subtotal: $${item.subtotal}\n\n`;
    });
    
    message += `─────────────────────────────────\n`;
    message += `💰 TOTAL AMOUNT: $${cart.total_price}\n`;
    message += `─────────────────────────────────\n\n`;
    
    message += `📍 SHIPPING ADDRESS:\n`;
    message += `${checkoutData.shipping_address_data.street}\n`;
    message += `${checkoutData.shipping_address_data.city}, ${checkoutData.shipping_address_data.state} ${checkoutData.shipping_address_data.zipcode}\n`;
    message += `${checkoutData.shipping_address_data.country}\n\n`;
    
    if (!checkoutData.same_as_shipping) {
      message += `📍 BILLING ADDRESS:\n`;
      message += `${checkoutData.billing_address_data.street}\n`;
      message += `${checkoutData.billing_address_data.city}, ${checkoutData.billing_address_data.state} ${checkoutData.billing_address_data.zipcode}\n`;
      message += `${checkoutData.billing_address_data.country}\n\n`;
    }
    
    message += `═══════════════════════════════\n`;
    message += `Thank you for your interest! 🎨✨\n`;
    message += `Contact: ${process.env.REACT_APP_MY_EMAIL || 'info@artgallery.com'}\n`;
    message += `═══════════════════════════════`;
    
    return encodeURIComponent(message);
  };

  // Handle form submission and redirect to WhatsApp
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      // Create order in backend for record keeping
      const orderResult = await dispatch(createOrder(checkoutData)).unwrap();
      
      // Generate WhatsApp message
      const whatsappMessage = generateWhatsAppMessage();
      
      // Get phone number from environment variables
      const phoneNumber = process.env.REACT_APP_MY_PHONE || '1234567890';
      
      // Validate phone number
      if (!phoneNumber || phoneNumber === '1234567890') {
        alert('Please configure REACT_APP_MY_PHONE in your .env file with your WhatsApp number');
        return;
      }
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
      
      // Redirect to WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Navigate to order confirmation page
      navigate(`/orders/${orderResult.id}`);
      
    } catch (err) {
      console.error('Order creation failed:', err);
    }
  };
  
  if (cartLoading) {
    return (
      <Container className="my-5">
        <p className="text-center">Loading cart...</p>
      </Container>
    );
  }
  
  if (cartError) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          Error loading cart: {cartError}
        </Alert>
      </Container>
    );
  }
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          Your cart is empty. Please add items before proceeding to checkout.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/gallery')}>
          Browse Gallery
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-5">
      <h1 className="mb-4">Checkout</h1>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <h3 className="mb-3">Shipping & Billing Information</h3>
              
              {error && (
                <Alert variant="danger">
                  {typeof error === 'object' ? 
                    Object.values(error).flat().join(' ') : 
                    error}
                </Alert>
              )}
              
              {Object.keys(formErrors).length > 0 && (
                <Alert variant="danger">
                  Please correct the highlighted fields below.
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <h4 className="mb-3">Shipping Address</h4>
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="shipping_street">
                      <Form.Label>Street Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={checkoutData.shipping_address_data.street}
                        onChange={(e) => handleAddressChange('shipping_address', 'street', e.target.value)}
                        placeholder="123 Main St, Apt 4B"
                        isInvalid={!!formErrors.shipping_street}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.shipping_street}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shipping_city">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        value={checkoutData.shipping_address_data.city}
                        onChange={(e) => handleAddressChange('shipping_address', 'city', e.target.value)}
                        placeholder="City"
                        isInvalid={!!formErrors.shipping_city}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.shipping_city}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="shipping_state">
                      <Form.Label>State/Province</Form.Label>
                      <Form.Select
                        value={checkoutData.shipping_address_data.state}
                        onChange={(e) => handleAddressChange('shipping_address', 'state', e.target.value)}
                        isInvalid={!!formErrors.shipping_state}
                        required
                      >
                        <option value="">Select State</option>
                        {checkoutData.shipping_address_data.country === 'United States' ? (
                          states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))
                        ) : (
                          <option value="Other">Other</option>
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {formErrors.shipping_state}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shipping_zipcode">
                      <Form.Label>Postal/Zip Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={checkoutData.shipping_address_data.zipcode}
                        onChange={(e) => handleAddressChange('shipping_address', 'zipcode', e.target.value)}
                        placeholder="Zip code"
                        isInvalid={!!formErrors.shipping_zipcode}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.shipping_zipcode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="shipping_country">
                      <Form.Label>Country</Form.Label>
                      <Form.Select
                        value={checkoutData.shipping_address_data.country}
                        onChange={(e) => handleAddressChange('shipping_address', 'country', e.target.value)}
                        isInvalid={!!formErrors.shipping_country}
                        required
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {formErrors.shipping_country}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="same_as_shipping">
                  <Form.Check 
                    type="checkbox"
                    label="Billing address same as shipping"
                    checked={checkoutData.same_as_shipping}
                    onChange={handleSameAsShipping}
                  />
                </Form.Group>
                
                {!checkoutData.same_as_shipping && (
                  <>
                    <h4 className="mb-3">Billing Address</h4>
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group controlId="billing_street">
                          <Form.Label>Street Address</Form.Label>
                          <Form.Control
                            type="text"
                            value={checkoutData.billing_address_data.street}
                            onChange={(e) => handleAddressChange('billing_address', 'street', e.target.value)}
                            placeholder="123 Main St, Apt 4B"
                            isInvalid={!!formErrors.billing_street}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {formErrors.billing_street}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="billing_city">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            value={checkoutData.billing_address_data.city}
                            onChange={(e) => handleAddressChange('billing_address', 'city', e.target.value)}
                            placeholder="City"
                            isInvalid={!!formErrors.billing_city}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {formErrors.billing_city}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="billing_state">
                          <Form.Label>State/Province</Form.Label>
                          <Form.Select
                            value={checkoutData.billing_address_data.state}
                            onChange={(e) => handleAddressChange('billing_address', 'state', e.target.value)}
                            isInvalid={!!formErrors.billing_state}
                            required
                          >
                            <option value="">Select State</option>
                            {checkoutData.billing_address_data.country === 'United States' ? (
                              states.map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))
                            ) : (
                              <option value="Other">Other</option>
                            )}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {formErrors.billing_state}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="billing_zipcode">
                          <Form.Label>Postal/Zip Code</Form.Label>
                          <Form.Control
                            type="text"
                            value={checkoutData.billing_address_data.zipcode}
                            onChange={(e) => handleAddressChange('billing_address', 'zipcode', e.target.value)}
                            placeholder="Zip code"
                            isInvalid={!!formErrors.billing_zipcode}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {formErrors.billing_zipcode}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="billing_country">
                          <Form.Label>Country</Form.Label>
                          <Form.Select
                            value={checkoutData.billing_address_data.country}
                            onChange={(e) => handleAddressChange('billing_address', 'country', e.target.value)}
                            isInvalid={!!formErrors.billing_country}
                            required
                          >
                            {countries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {formErrors.billing_country}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
                
                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/cart')}
                  >
                    Back to Cart
                  </Button>
                  
                  <Button
                    variant="success"
                    type="submit"
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <i className="fab fa-whatsapp"></i>
                        Contact via WhatsApp - $${cart.total_price}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h3 className="mb-3">Order Summary</h3>
              
              {cart.items.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2">
                  <span>
                    {item.quantity} x {item.art_picture.title}
                  </span>
                  <span>${item.subtotal}</span>
                </div>
              ))}
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${cart.total_price}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>${cart.total_price}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage; 