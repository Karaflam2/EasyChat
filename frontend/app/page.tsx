'use client';

import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageInput } from '@/components/MessageInput';
import { RoomList } from '@/components/RoomList';
import { UserList } from '@/components/UserList';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.10.5:3001' || 'http://localhost:3001';

export default function Home() {
  const [view, setView] = useState<'login' | 'chat'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentUser, setCurrentUser, setToken, setRooms, setRoomUsers, logout } = useChatStore();

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      setToken(savedToken);
      setView('chat');
      loadRooms(savedToken);
      initSocket(parsedUser.id, parsedUser.username, savedToken);
    }
  }, []);

  const loadRooms = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rooms = await response.json();
      setRooms(rooms);

      console.log("Type de rooms:", typeof rooms, "Contenu de rooms:", rooms);
      // Load users for each room
      if (rooms && Array.isArray(rooms)) { // ou if (rooms && Array.isArray(rooms))
          rooms.forEach((room: any) => {
          loadRoomUsers(room.id, token);
      });
        } else {
            console.error("Échec du chargement des rooms:", rooms);
            // Ajoutez ici une logique pour gérer l'erreur, comme afficher un message à l'utilisateur.
        }
      }
      catch (err) {
            console.error('Failed to load rooms:', err);
          }
        };

  const loadRoomUsers = async (roomId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = await response.json();
      setRoomUsers(roomId, users);
    } catch (err) {
      console.error('Failed to load room users:', err);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const body = isLoginMode
        ? { email, password }
        : { username, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setCurrentUser(data.user);
      setToken(data.token);
      
      initSocket(data.user.id, data.user.username, data.token);
      await loadRooms(data.token);
      
      setView('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    logout();
    setView('login');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-300">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💬</div>
              <h1 className="text-4xl font-bold text-blue-600 mb-2">ChatBox</h1>
              <p className="text-pink-500 font-semibold">Let's chat together! 🎉</p>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-bold text-purple-600 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a cool name!"
                    className="w-full px-4 py-2 border-2 border-green-300 rounded-xl focus:outline-none focus:border-green-500 bg-green-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 bg-orange-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-xl focus:outline-none focus:border-pink-500 bg-pink-50"
                />
              </div>

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition transform hover:scale-105 mt-6"
              >
                {loading ? '⏳ Loading...' : isLoginMode ? '🚀 Login' : '✨ Register'}
              </button>

              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                }}
                className="w-full text-purple-600 font-semibold py-2 hover:text-purple-800 transition"
              >
                {isLoginMode ? "Don't have account? Register 📝" : 'Already have account? Login 🔑'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHAT VIEW
  return (
    <div className="flex h-screen bg-yellow-50">
      {/* SIDEBAR */}
      <div className="w-80 bg-gradient-to-b from-purple-300 to-pink-200 flex flex-col border-r-4 border-purple-400 shadow-lg">
        {/* Header */}
        <div className="p-6 bg-white border-b-4 border-purple-300 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">👤</div>
              <div>
                <p className="font-bold text-purple-700">{currentUser?.username}</p>
                <p className="text-xs text-green-600 font-semibold">🟢 Online</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-400 hover:bg-red-500 text-white p-2 rounded-xl transition transform hover:scale-110"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Room List */}
        <RoomList />
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
        {currentUser && (
          <>
            {/* Room Header */}
            <div className="bg-gradient-to-r from-orange-300 to-yellow-300 p-6 border-b-4 border-orange-400 shadow-md">
              <h2 className="text-2xl font-bold text-orange-700">ChatBox 💬</h2>
              <p className="text-sm text-orange-600">Welcome back, {currentUser.username}! 👋</p>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                <ChatWindow />
                <MessageInput />
              </div>

              {/* Users Sidebar */}
              <UserList />
            </div>
          </>
        )}
      </div>
    </div>
  );
}