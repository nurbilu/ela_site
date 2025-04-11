import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { fetchCart } from '../store/slices/cartSlice';
import { createOrder, processPayment } from '../store/slices/ordersSlice';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const { cart, loading: cartLoading, error: cartError } = useSelector(state => state.cart);
  const { currentOrder, loading, error, paymentLoading, paymentError, paymentSuccess } = useSelector(state => state.orders);
  
  const [checkoutData, setCheckoutData] = useState({
    shipping_address: '',
    billing_address: '',
    payment_method: 'credit_card',
  });
  
  const [cardError, setCardError] = useState('');
  
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  
  useEffect(() => {
    // If payment successful, redirect to order confirmation
    if (paymentSuccess && currentOrder) {
      navigate(`/orders/${currentOrder.id}`);
    }
  }, [paymentSuccess, currentOrder, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCheckoutData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCardChange = (e) => {
    if (e.error) {
      setCardError(e.error.message);
    } else {
      setCardError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    // Validate form
    if (!checkoutData.shipping_address || !checkoutData.billing_address) {
      return;
    }
    
    // Create order first
    try {
      const orderResult = await dispatch(createOrder(checkoutData)).unwrap();
      
      // Process payment if order was created successfully
      if (orderResult.id) {
        if (checkoutData.payment_method === 'credit_card') {
          const cardElement = elements.getElement(CardElement);
          
          if (!cardElement) {
            return;
          }
          
          // Create payment token
          const { error, token } = await stripe.createToken(cardElement);
          
          if (error) {
            setCardError(error.message);
            return;
          }
          
          // Process payment
          await dispatch(processPayment({
            orderId: orderResult.id,
            paymentData: { token: token.id }
          }));
        } else if (checkoutData.payment_method === 'paypal') {
          // For PayPal, we'll just simulate a successful payment
          await dispatch(processPayment({
            orderId: orderResult.id,
            paymentData: { token: 'simulated-paypal-token' }
          }));
        }
      }
    } catch (err) {
      console.error('Checkout failed:', err);
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
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="shipping_address">
                  <Form.Label>Shipping Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="shipping_address"
                    value={checkoutData.shipping_address}
                    onChange={handleChange}
                    placeholder="Enter your full shipping address"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="billing_address">
                  <Form.Label>Billing Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="billing_address"
                    value={checkoutData.billing_address}
                    onChange={handleChange}
                    placeholder="Enter your full billing address"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="payment_method">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={checkoutData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                  </Form.Select>
                </Form.Group>
                
                {checkoutData.payment_method === 'credit_card' && (
                  <div className="mb-4">
                    <label className="form-label">Card Information</label>
                    <div className="border rounded p-3">
                      <CardElement onChange={handleCardChange} />
                    </div>
                    {cardError && (
                      <div className="text-danger mt-2">
                        {cardError}
                      </div>
                    )}
                  </div>
                )}
                
                {paymentError && (
                  <Alert variant="danger">
                    Payment error: {paymentError}
                  </Alert>
                )}
                
                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/cart')}
                  >
                    Back to Cart
                  </Button>
                  
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || paymentLoading}
                  >
                    {loading || paymentLoading
                      ? 'Processing...'
                      : `Place Order - $${cart.total_price}`}
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