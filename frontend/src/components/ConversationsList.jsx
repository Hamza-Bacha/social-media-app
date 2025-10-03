// frontend/src/components/ConversationsList.jsx
import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function ConversationsList({ 
  conversations, 
  activeConversation, 
  onConversationSelect 
}) {
  const { isUserOnline } = useSocket();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-sm">Start a new conversation to begin messaging</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation) => {
        const isActive = activeConversation?._id === conversation._id;
        const otherUser = conversation.otherParticipant;
        const isOnline = otherUser ? isUserOnline(otherUser._id) : false;
        
        return (
          <div
            key={conversation._id}
            onClick={() => onConversationSelect(conversation)}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
              isActive ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Conversation info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium truncate ${
                    isActive ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {conversation.displayName || 'Unknown User'}
                  </h3>
                  {conversation.lastActivity && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(conversation.lastActivity)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {conversation.lastMessage ? (
                      <>
                        {conversation.lastMessage.sender._id === conversation.otherParticipant?._id ? '' : 'You: '}
                        {conversation.lastMessage.content.type === 'text' 
                          ? truncateMessage(conversation.lastMessage.content.text)
                          : '📷 Image'
                        }
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </p>

                  {/* Unread count */}
                  {conversation.unreadCount > 0 && (
                    <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}