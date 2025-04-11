import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Carousel } from 'react-bootstrap';
import { fetchArtPictures } from '../store/slices/artPicturesSlice';
import ArtPictureCard from '../components/art/ArtPictureCard';

const HomePage = () => {
  const dispatch = useDispatch();
  const { artPictures, loading, error } = useSelector(state => state.artPictures);
  
  useEffect(() => {
    dispatch(fetchArtPictures());
  }, [dispatch]);
  
  // Get the 3 most recent art pictures for the featured section
  const featuredArtPictures = artPictures
    .slice() // Create a copy of the array to avoid mutation
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="bg-light p-5 mb-5 rounded">
        <Container>
          <Row>
            <Col md={6}>
              <h1>Welcome to Art Gallery</h1>
              <p className="lead">
                Discover beautiful art pieces by talented artists from around the world.
                Browse our collection and find your next favorite artwork.
              </p>
              <Link to="/gallery">
                <Button variant="primary" size="lg">Explore Gallery</Button>
              </Link>
            </Col>
            <Col md={6} className="d-flex align-items-center">
              {!loading && featuredArtPictures.length > 0 && (
                <Carousel className="w-100">
                  {featuredArtPictures.map(art => (
                    <Carousel.Item key={art.id}>
                      <img
                        className="d-block w-100"
                        src={art.image}
                        alt={art.title}
                        style={{ height: '300px', objectFit: 'cover' }}
                      />
                      <Carousel.Caption>
                        <h3>{art.title}</h3>
                        <p>${art.price}</p>
                      </Carousel.Caption>
                    </Carousel.Item>
                  ))}
                </Carousel>
              )}
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Featured Art Section */}
      <Container>
        <h2 className="text-center mb-4">Featured Artwork</h2>
        {loading ? (
          <p className="text-center">Loading featured artwork...</p>
        ) : error ? (
          <p className="text-center text-danger">Error loading artwork: {error}</p>
        ) : (
          <Row xs={1} md={3} className="g-4">
            {featuredArtPictures.map(artPicture => (
              <Col key={artPicture.id}>
                <ArtPictureCard artPicture={artPicture} />
              </Col>
            ))}
          </Row>
        )}
        <div className="text-center mt-4">
          <Link to="/gallery">
            <Button variant="outline-primary">View All Artwork</Button>
          </Link>
        </div>
      </Container>
      
      {/* About Section */}
      <div className="bg-light p-5 mt-5">
        <Container>
          <Row>
            <Col md={8} className="mx-auto text-center">
              <h2>About Art Gallery</h2>
              <p>
                Art Gallery is a premier destination for art enthusiasts looking to discover
                and purchase unique artwork. We curate a diverse collection of paintings,
                drawings, and other artistic creations from both established and emerging artists.
              </p>
              <p>
                Each piece in our gallery is carefully selected for its quality, creativity,
                and artistic value. We believe that art should be accessible to everyone,
                which is why we offer artwork at various price points.
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default HomePage; 