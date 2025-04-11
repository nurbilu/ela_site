import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';

const ArtPictureCard = ({ artPicture }) => {
  return (
    <Card className="h-100">
      <Card.Img 
        variant="top" 
        src={artPicture.image} 
        alt={artPicture.title}
        className="img-fluid"
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{artPicture.title}</Card.Title>
        <Card.Text>
          {artPicture.description.length > 100
            ? `${artPicture.description.substring(0, 100)}...`
            : artPicture.description}
        </Card.Text>
        <Card.Text className="text-primary fw-bold mt-auto">
          ${artPicture.price}
        </Card.Text>
        <Link to={`/art/${artPicture.id}`} className="mt-2">
          <Button variant="primary" className="w-100">View Details</Button>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default ArtPictureCard; 