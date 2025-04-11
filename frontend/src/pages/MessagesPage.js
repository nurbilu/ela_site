import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendUserMessage } from '../store/slices/messagesSlice';

const MessagesPage = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector(state => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchMessages());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      setFormError('Message cannot be empty');
      return;
    }
    
    dispatch(sendUserMessage({ content: newMessage }));
    setNewMessage('');
    setFormError('');
  };

  return (
    <div className="messages-page container">
      <h1>My Messages</h1>
      
      <div className="message-form-container">
        <h2>Send a New Message</h2>
        <form onSubmit={handleSubmit} className="message-form">
          <div className="form-group">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className={`form-control ${formError ? 'is-invalid' : ''}`}
              placeholder="Type your message here..."
              rows="4"
            ></textarea>
            {formError && <div className="invalid-feedback">{formError}</div>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
      
      <div className="messages-container">
        <h2>Message History</h2>
        {loading && <div className="loading">Loading messages...</div>}
        {error && <div className="error-message">Error: {error}</div>}
        
        {!loading && !error && messages.length === 0 ? (
          <div className="no-messages">You have no messages yet.</div>
        ) : (
          <div className="messages-list">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message-card ${message.fromUser ? 'user-message' : 'admin-message'}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.fromUser ? 'You' : 'Art Gallery Admin'}
                  </span>
                  <span className="message-date">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage; 