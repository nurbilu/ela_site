import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Table, Button, Image, Alert } from 'react-bootstrap';
import { fetchCart, updateItemQuantity, removeItemFromCart, clearCart } from '../store/slices/cartSlice';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading, error } = useSelector(state => state.cart);
  
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    dispatch(updateItemQuantity({
      item_id: itemId,
      quantity: newQuantity
    }));
  };
  
  const handleRemoveItem = (itemId) => {
    dispatch(removeItemFromCart(itemId));
  };
  
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };
  
  const handleCheckout = () => {
    navigate('/checkout');
  };
  
  if (loading) {
    return (
      <Container className="my-5">
        <p className="text-center">Loading cart...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          Error loading cart: {error}
        </Alert>
      </Container>
    );
  }
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any artwork to your cart yet.</p>
          <Link to="/gallery">
            <Button variant="primary">Browse Gallery</Button>
          </Link>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="my-5">
      <h1 className="mb-4">Shopping Cart</h1>
      
      <Row>
        <Col lg={8}>
          <Table responsive>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map(item => (
                <tr key={item.id} className="cart-item">
                  <td>
                    <div className="d-flex align-items-center">
                      <Image
                        src={item.art_picture.image}
                        alt={item.art_picture.title}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover' }}
                        className="me-3"
                      />
                      <div>
                        <h5>{item.art_picture.title}</h5>
                      </div>
                    </div>
                  </td>
                  <td>${item.art_picture.price}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-2">{item.quantity}</span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td>${item.subtotal}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <div className="d-flex justify-content-between mt-3">
            <Button
              variant="outline-danger"
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
            <Link to="/gallery">
              <Button variant="outline-primary">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Col>
        
        <Col lg={4}>
          <div className="cart-summary p-4 border rounded">
            <h3 className="mb-4">Cart Summary</h3>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <span>${cart.total_price}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            
            <hr />
            
            <div className="d-flex justify-content-between mb-4 fw-bold">
              <span>Total:</span>
              <span>${cart.total_price}</span>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              className="w-100"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage; 