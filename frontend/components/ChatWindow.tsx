import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';

export const ChatWindow = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentRoomId, currentUser, typingUsers } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentRoomId) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="text-8xl mb-6">👋</div>
          <h2 className="text-3xl font-bold text-purple-700 mb-2">Welcome to ChatBox!</h2>
          <p className="text-purple-600 font-semibold">Select a room to start chatting 🎉</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[currentRoomId] || [];
  const roomTypingUsers = typingUsers[currentRoomId] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-yellow-50 to-white">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-gray-400 font-semibold">No messages yet. Start the conversation! 🎉</p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.username === currentUser?.username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  msg.username === currentUser?.username
                    ? 'bg-cyan-300 text-gray-800 border-2 border-cyan-400'
                    : 'bg-pink-300 text-gray-800 border-2 border-pink-400'
                }`}
              >
                {msg.username !== currentUser?.username && (
                  <p className="text-xs font-bold text-purple-700 mb-1">{msg.username}</p>
                )}
                <p className="break-words">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {roomTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
            <span>{roomTypingUsers.join(', ')} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};