import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Button, Image, Form, Alert } from 'react-bootstrap';
import { fetchArtPictureById, clearCurrentArtPicture } from '../store/slices/artPicturesSlice';
import { addItemToCart } from '../store/slices/cartSlice';

const ArtPictureDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentArtPicture, loading, error } = useSelector(state => state.artPictures);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { loading: cartLoading, error: cartError } = useSelector(state => state.cart);
  
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  
  useEffect(() => {
    dispatch(fetchArtPictureById(id));
    
    // Cleanup function
    return () => {
      dispatch(clearCurrentArtPicture());
    };
  }, [dispatch, id]);
  
  const handleQuantityChange = (e) => {
    setQuantity(parseInt(e.target.value));
  };
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(addItemToCart({
      art_picture_id: currentArtPicture.id,
      quantity
    })).then(() => {
      setAddedToCart(true);
      
      // Reset the "Added to cart" message after 3 seconds
      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    });
  };
  
  if (loading) {
    return (
      <Container>
        <p className="text-center my-5">Loading art picture details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="my-5">
          Error loading art picture: {error}
        </Alert>
      </Container>
    );
  }
  
  if (!currentArtPicture) {
    return (
      <Container>
        <Alert variant="warning" className="my-5">
          Art picture not found.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="art-picture-detail my-5">
      <Row>
        <Col md={6}>
          <Image 
            src={currentArtPicture.image} 
            alt={currentArtPicture.title}
            fluid
            className="art-picture-image"
          />
        </Col>
        <Col md={6}>
          <h1>{currentArtPicture.title}</h1>
          <p className="text-muted">
            Added on: {new Date(currentArtPicture.created_at).toLocaleDateString()}
          </p>
          
          <h2 className="text-primary my-3">${currentArtPicture.price}</h2>
          
          <p>{currentArtPicture.description}</p>
          
          {currentArtPicture.is_available ? (
            <>
              <Form className="mb-3">
                <Form.Group controlId="quantity">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    style={{ width: '100px' }}
                  />
                </Form.Group>
              </Form>
              
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleAddToCart}
                disabled={cartLoading}
              >
                {cartLoading ? 'Adding to Cart...' : 'Add to Cart'}
              </Button>
              
              {addedToCart && (
                <Alert variant="success" className="mt-3">
                  Added to cart successfully!
                </Alert>
              )}
              
              {cartError && (
                <Alert variant="danger" className="mt-3">
                  Error adding to cart: {cartError}
                </Alert>
              )}
            </>
          ) : (
            <Alert variant="warning">
              This art picture is currently not available for purchase.
            </Alert>
          )}
          
          <div className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Back to Gallery
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ArtPictureDetailPage; 