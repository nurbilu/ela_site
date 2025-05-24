import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-4 mt-4">
      <Container>
        <Row>
          <Col md={6}>
            <h5>Art Gallery</h5>
            <p>
              Discover beautiful art pieces by talented artists.
              Browse our collection and find your next favorite artwork.
            </p>
          </Col>
          {/* <Col md={3 } className='col-md-3'>
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li><a href="/">Home</a></li>
              <li><a href="/gallery">Gallery</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Register</a></li>
            </ul>
          </Col> */}
          <Col md={3}>
            <h5>Contact</h5>
            <ul className="list-unstyled">
              <li>Email: elalitayeb@gmail.com</li>
              <li>Phone: +972 52 555 55 55</li>
              <li>Address: 123 Art St, tel aviv</li>
            </ul>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col className="text-center">
            <p className="mb-0">
              &copy; {year} Art Gallery. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 