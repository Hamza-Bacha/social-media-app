import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';
import ConversationsList from '../components/ConversationsList';
import ChatWindow from '../components/ChatWindow';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        fetchMessages(conversationId);
      }
    }
  }, [conversationId, conversations]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messages/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setMessagesLoading(true);
      const response = await api.get(`/api/messages/conversations/${convId}/messages`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/users?search=${query}`);
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const response = await api.post('/api/messages/conversations', { 
        recipientId: userId 
      });
      const newConversation = response.data.conversation;
      
      setConversations(prev => [newConversation, ...prev]);
      handleConversationSelect(newConversation);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start conversation');
    }
  };

  const handleSendMessage = async (content, type = 'text') => {
    if (!activeConversation) return;

    const recipientId = activeConversation.otherParticipant?._id;
    if (!recipientId) return;

    try {
      const response = await api.post('/api/messages/send', {
        recipientId,
        content,
        type
      });

      const newMessage = response.data.data;
      setMessages(prev => [...prev, newMessage]);
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
    navigate(`/messages/${conversation._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>💬 Direct Messages</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Offline Mode
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowNewChat(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex h-[600px]">
          <div className="w-1/3 border-r border-gray-200">
            <ConversationsList
              conversations={conversations}
              activeConversation={activeConversation}
              onConversationSelect={handleConversationSelect}
            />
          </div>

          <div className="flex-1">
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                loading={messagesLoading}
                onSendMessage={handleSendMessage}
                currentUser={user}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChatBubbleOvalLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Message</h3>
              <button 
                onClick={() => {
                  setShowNewChat(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleStartChat(user._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{user.username}</p>
                    {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}
                  </div>
                </button>
              ))}
              
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-500 py-4">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}