import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const NotFoundPage = () => {
  return (
    <Container className="text-center my-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <h1 className="display-1 mb-4">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="mb-4">
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </p>
          <Link to="/">
            <Button variant="primary" size="lg">
              Return to Home
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 