import React, { createContext, useContext } from 'react';

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      joinConversation: () => {},
      leaveConversation: () => {},
      emitTyping: () => {},
      markMessageAsRead: () => {},
      isUserOnline: () => false
    };
  }
  return context;
}

export function SocketProvider({ children }) {
  const value = {
    socket: null,
    isConnected: false,
    onlineUsers: new Set(),
    joinConversation: () => {},
    leaveConversation: () => {},
    emitTyping: () => {},
    markMessageAsRead: () => {},
    isUserOnline: () => false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}