import React, { useState, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { sendMessage, startTyping, stopTyping } from '@/lib/socket';

export const MessageInput = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { currentRoomId } = useChatStore();
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!isTyping && value.length > 0 && currentRoomId) {
      setIsTyping(true);
      startTyping(currentRoomId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (currentRoomId) {
        stopTyping(currentRoomId);
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleSend = () => {
    if (input.trim() && currentRoomId) {
      sendMessage(currentRoomId, input);
      stopTyping(currentRoomId);
      setInput('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && currentRoomId) {
        stopTyping(currentRoomId);
      }
    };
  }, [isTyping, currentRoomId]);

  return (
    <div className="bg-gradient-to-r from-green-300 to-cyan-300 p-4 border-t-4 border-green-400">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... 💬"
          className="flex-1 px-4 py-3 border-2 border-green-400 rounded-full focus:outline-none focus:border-green-600 bg-white font-semibold"
        />
        <button
          onClick={handleSend}
          className="bg-white hover:bg-green-50 text-green-600 p-3 rounded-full font-bold transition transform hover:scale-110 border-2 border-green-400"
          title="Send message"
        >
          <Send size={20} />
        </button>
        <button
          className="bg-white hover:bg-yellow-50 text-yellow-500 p-3 rounded-full font-bold transition transform hover:scale-110 border-2 border-yellow-400"
          title="Emoji picker"
        >
          <Smile size={20} />
        </button>
      </div>
    </div>
  );
};