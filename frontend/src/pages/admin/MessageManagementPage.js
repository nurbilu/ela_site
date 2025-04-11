import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchMessages, 
  markMessageAsRead,
  sendPublicMessage
} from '../../store/slices/messagesSlice';

const MessageManagementPage = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector(state => state.messages);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    dispatch(fetchMessages());
  }, [dispatch]);

  const handleSelectMessage = (messageId) => {
    setSelectedMessageId(messageId);
    
    // Mark as read if it's unread
    const message = messages.find(m => m.id === messageId);
    if (message && !message.isRead) {
      dispatch(markMessageAsRead(messageId));
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      return;
    }
    
    dispatch(sendPublicMessage({
      messageId: selectedMessageId,
      content: replyContent
    }));
    
    setReplyContent('');
  };

  const getFilteredMessages = () => {
    if (filterUnread) {
      return messages.filter(message => !message.isRead);
    }
    return messages;
  };

  const selectedMessage = messages.find(m => m.id === selectedMessageId);
  const filteredMessages = getFilteredMessages();

  return (
    <div className="message-management-page">
      <h1>Message Management</h1>
      
      <div className="filter-section">
        <div className="filter-checkbox">
          <input
            type="checkbox"
            id="filterUnread"
            checked={filterUnread}
            onChange={(e) => setFilterUnread(e.target.checked)}
          />
          <label htmlFor="filterUnread">Show only unread messages</label>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading messages...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : (
        <div className="messages-container">
          <div className="messages-list">
            <h2>Messages ({filteredMessages.length})</h2>
            {filteredMessages.length === 0 ? (
              <div className="no-messages">No messages to display</div>
            ) : (
              <div className="message-items">
                {filteredMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message-item ${message.isRead ? '' : 'unread'} ${selectedMessageId === message.id ? 'selected' : ''}`}
                    onClick={() => handleSelectMessage(message.id)}
                  >
                    <div className="message-header">
                      <div className="message-sender">
                        {message.user.firstName} {message.user.lastName}
                      </div>
                      <div className="message-date">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="message-preview">
                      {message.content.length > 50
                        ? `${message.content.substring(0, 50)}...`
                        : message.content
                      }
                    </div>
                    {!message.isRead && <div className="unread-badge">Unread</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="message-detail">
            {selectedMessage ? (
              <div className="selected-message">
                <div className="message-info">
                  <h2>Message from {selectedMessage.user.firstName} {selectedMessage.user.lastName}</h2>
                  <p className="message-date">
                    Received on {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="message-thread">
                  {/* Original message */}
                  <div className="message-bubble user-message">
                    <p className="message-content">{selectedMessage.content}</p>
                    <p className="message-timestamp">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Replies */}
                  {selectedMessage.replies && selectedMessage.replies.map(reply => (
                    <div 
                      key={reply.id} 
                      className={`message-bubble ${reply.fromAdmin ? 'admin-message' : 'user-message'}`}
                    >
                      <p className="message-content">{reply.content}</p>
                      <p className="message-timestamp">
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="reply-form-container">
                  <h3>Reply to this message</h3>
                  <form onSubmit={handleSendReply} className="reply-form">
                    <div className="form-group">
                      <textarea 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply here..."
                        rows="4"
                        className="form-control"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!replyContent.trim()}
                    >
                      Send Reply
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="no-message-selected">
                <p>Select a message to view its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagementPage; 