import React from 'react';
import { useChatStore } from '@/store/chatStore';

export const UserList = () => {
  const { currentRoomId, roomUsers } = useChatStore();

  const currentRoomUsers = currentRoomId ? roomUsers[currentRoomId] || [] : [];

  const onlineUsers = currentRoomUsers.filter((u) => u.status === 'online');
  const awayUsers = currentRoomUsers.filter((u) => u.status === 'away');
  const offlineUsers = currentRoomUsers.filter((u) => u.status === 'offline');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'away':
        return '🟡';
      case 'offline':
        return '⚫';
      default:
        return '⚫';
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-blue-300 to-cyan-200 flex flex-col border-l-4 border-blue-400 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b-2 border-blue-300">
        <h3 className="font-bold text-blue-700">👥 Members</h3>
        <p className="text-xs text-gray-600">{currentRoomUsers.length} people</p>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div>
            <p className="text-xs font-bold text-green-700 mb-2">🟢 ONLINE ({onlineUsers.length})</p>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border-2 border-green-300 hover:bg-green-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-700 truncate">{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Away Users */}
        {awayUsers.length > 0 && (
          <div>
            <p className="text-xs font-bold text-yellow-700 mb-2">🟡 AWAY ({awayUsers.length})</p>
            <div className="space-y-2">
              {awayUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border-2 border-yellow-300 hover:bg-yellow-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-yellow-700 truncate">{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">⚫ OFFLINE ({offlineUsers.length})</p>
            <div className="space-y-2">
              {offlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border-2 border-gray-300 hover:bg-gray-50 transition opacity-60"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-600 truncate">{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentRoomUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-600 text-sm font-semibold">No users in this room</p>
          </div>
        )}
      </div>
    </div>
  );
};