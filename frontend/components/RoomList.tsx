import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { joinRoom } from '@/lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const RoomList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { rooms, currentRoomId, token, setCurrentRoom, setMessages, addRoom } = useChatStore();

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fetchRoomMessages = async (roomId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const mapped = data.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(roomId, mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des messages', error);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setCurrentRoom(roomId);
    joinRoom(roomId);
    fetchRoomMessages(roomId);
  };

  const handleCreateRoom = async () => {
    if (!token) return;

    const name = prompt('Nom de la room ?');
    if (!name || !name.trim()) return;

    const description = prompt('Description (optionnel)') || '';

    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Impossible de créer la room');
        return;
      }

      const room = await response.json();
      addRoom(room);
      setCurrentRoom(room.id);
      joinRoom(room.id);
      fetchRoomMessages(room.id);
    } catch (error) {
      console.error('Erreur lors de la création de room', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b-2 border-purple-300 bg-white">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-purple-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms..."
            className="w-full pl-10 pr-4 py-2 border-2 border-purple-400 rounded-xl focus:outline-none focus:border-purple-600 bg-purple-50"
          />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <p className="text-sm font-bold text-purple-700 mb-3 px-2">📌 Your Rooms</p>
        {filteredRooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 font-semibold">No rooms found 🔍</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleSelectRoom(room.id)}
              className={`w-full p-3 rounded-xl transition transform hover:scale-105 font-semibold border-2 text-left ${
                currentRoomId === room.id
                  ? 'bg-white border-orange-400 shadow-md'
                  : 'bg-white bg-opacity-70 border-transparent hover:bg-opacity-100 border-purple-200'
              }`}
            >
              <p className="text-purple-700 font-bold">#{room.name}</p>
              <p className="text-xs text-gray-600">{room.description || 'No description'}</p>
            </button>
          ))
        )}
      </div>

      {/* Create Room Button */}
      <div className="p-4 border-t-2 border-purple-300 bg-white">
        <button
          onClick={handleCreateRoom}
          className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition transform hover:scale-105 border-2 border-cyan-500"
        >
          <Plus size={20} /> New Room
        </button>
      </div>
    </div>
  );
};