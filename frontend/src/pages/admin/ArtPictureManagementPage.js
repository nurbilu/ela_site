import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchArtPictures,
  createArtPicture,
  updateArtPicture,
  deleteArtPicture
} from '../../store/slices/artPicturesSlice';

const ArtPictureManagementPage = () => {
  const dispatch = useDispatch();
  const { artPictures, loading, error } = useSelector(state => state.artPictures);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artistName: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    category: ''
  });

  useEffect(() => {
    dispatch(fetchArtPictures());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      artistName: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
      category: ''
    });
    setEditingId(null);
  };

  const handleEditClick = (artPicture) => {
    setFormData({
      title: artPicture.title,
      description: artPicture.description,
      artistName: artPicture.artistName,
      price: artPicture.price.toString(),
      imageUrl: artPicture.imageUrl,
      isAvailable: artPicture.isAvailable,
      category: artPicture.category
    });
    setEditingId(artPicture.id);
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('Are you sure you want to delete this art picture?')) {
      dispatch(deleteArtPicture(id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const artPictureData = {
      ...formData,
      price: parseFloat(formData.price)
    };
    
    if (editingId) {
      dispatch(updateArtPicture({
        id: editingId,
        artPictureData
      }));
    } else {
      dispatch(createArtPicture(artPictureData));
    }
    
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="art-picture-management-page">
      <div className="page-header">
        <h1>Art Picture Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'Add New Art Picture'}
        </button>
      </div>

      {showForm && (
        <div className="art-form-container">
          <h2>{editingId ? 'Edit Art Picture' : 'Add New Art Picture'}</h2>
          <form onSubmit={handleSubmit} className="art-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="artistName">Artist Name</label>
              <input
                type="text"
                id="artistName"
                name="artistName"
                value={formData.artistName}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="form-control"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="isAvailable">
                Available for Sale
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update Art Picture' : 'Create Art Picture'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading art pictures...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : (
        <div className="art-pictures-list">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Price</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artPictures.map(art => (
                <tr key={art.id}>
                  <td>
                    <img 
                      src={art.imageUrl} 
                      alt={art.title} 
                      className="art-thumbnail" 
                    />
                  </td>
                  <td>{art.title}</td>
                  <td>{art.artistName}</td>
                  <td>${art.price.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${art.isAvailable ? 'available' : 'sold'}`}>
                      {art.isAvailable ? 'Available' : 'Sold'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditClick(art)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteClick(art.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArtPictureManagementPage; 