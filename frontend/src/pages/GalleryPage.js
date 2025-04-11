import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { fetchArtPictures } from '../store/slices/artPicturesSlice';
import ArtPictureCard from '../components/art/ArtPictureCard';

const GalleryPage = () => {
  const dispatch = useDispatch();
  const { artPictures, loading, error } = useSelector(state => state.artPictures);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState('newest');
  
  useEffect(() => {
    dispatch(fetchArtPictures());
  }, [dispatch]);
  
  // Filter and sort art pictures
  const filteredArtPictures = artPictures
    .filter(art => {
      // Filter by search term
      const searchMatch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by price range
      const minPriceMatch = priceRange.min === '' || Number(art.price) >= Number(priceRange.min);
      const maxPriceMatch = priceRange.max === '' || Number(art.price) <= Number(priceRange.max);
      
      return searchMatch && minPriceMatch && maxPriceMatch;
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleMinPriceChange = (e) => {
    setPriceRange({ ...priceRange, min: e.target.value });
  };
  
  const handleMaxPriceChange = (e) => {
    setPriceRange({ ...priceRange, max: e.target.value });
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  return (
    <div className="gallery-page">
      <Container>
        <h1 className="text-center mb-4">Art Gallery</h1>
        
        {/* Filters and Sort */}
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by title or description"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Label>Price Range</Form.Label>
            <Row>
              <Col>
                <InputGroup className="mb-3">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={handleMinPriceChange}
                  />
                </InputGroup>
              </Col>
              <Col>
                <InputGroup className="mb-3">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={handleMaxPriceChange}
                  />
                </InputGroup>
              </Col>
            </Row>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Sort By</Form.Label>
              <Form.Select
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="a-z">Title: A to Z</option>
                <option value="z-a">Title: Z to A</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        {/* Art Pictures Grid */}
        {loading ? (
          <p className="text-center">Loading artwork...</p>
        ) : error ? (
          <p className="text-center text-danger">Error loading artwork: {error}</p>
        ) : filteredArtPictures.length === 0 ? (
          <p className="text-center">No artwork found matching your filters.</p>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {filteredArtPictures.map(artPicture => (
              <Col key={artPicture.id}>
                <ArtPictureCard artPicture={artPicture} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default GalleryPage; 