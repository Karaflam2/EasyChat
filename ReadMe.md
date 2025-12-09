# 📚 Documentation Complète - Application Messagerie

## Table des Matières
1. [Architecture Globale](#architecture-globale)
2. [Frontend](#frontend)
3. [Backend](#backend)
4. [Socket.IO](#socketio)
5. [Base de Données](#base-de-données)
6. [Flux de Communication](#flux-de-communication)
7. [Guide Pratique par Fonctionnalité](#guide-pratique-par-fonctionnalité)

---

## Architecture Globale

### Qu'est-ce que c'est ?

Votre application est divisée en **3 serveurs indépendants** qui communiquent ensemble :

```
┌─────────────────────────────────────────────────────────────┐
│                     VOTRE ORDINATEUR                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Next.js)          Backend (Express)  Socket.IO   │
│  Port: 3000                  Port: 3001        Port: 3002   │
│  Interface utilisateur       Logique métier    Temps réel   │
│         ↕                          ↕                ↕        │
│         └──────────────────────────┴────────────────┘       │
│                      PostgreSQL (Docker)                    │
│                      Port: 5432                             │
│                    Base de données                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pourquoi 3 serveurs ?

- **Frontend** : Ce que voit l'utilisateur (interface)
- **Backend API** : Logique métier (authentification, créer des salons, etc.)
- **Socket.IO** : Communication temps réel (messages instantanés, typing indicators)

Ils travaillent ensemble, mais chacun a son rôle.

---

# Frontend (Next.js)

## 🎨 Qu'est-ce que c'est ?

C'est l'**interface que les utilisateurs voient et utilisent**. C'est où ils se connectent, envoient des messages, voient les autres utilisateurs.

## 📁 Structure des Fichiers

```
frontend/
├── src/
│   ├── app/                    # Pages principales
│   │   ├── page.tsx           # Page de login/register
│   │   ├── chat/page.tsx       # Page du chat
│   │   └── layout.tsx          # Layout global
│   │
│   ├── components/            # Composants réutilisables
│   │   ├── ChatWindow.tsx      # Affiche les messages
│   │   ├── MessageInput.tsx    # Input pour écrire des messages
│   │   ├── RoomList.tsx        # Liste des salons
│   │   └── UserList.tsx        # Liste des utilisateurs
│   │
│   ├── store/                 # Gestion de l'état global
│   │   └── chatStore.ts       # Zustand store (données partagées)
│   │
│   └── lib/                   # Utilitaires
│       └── socket.ts          # Connexion Socket.IO
│
└── .env.local                 # Variables d'environnement
```

## 🔑 Concepts Clés

### 1. **Store (chatStore.ts)** - La "mémoire" de l'app

C'est une **boîte centralisée** où on stocke les données que plein de composants utilisent :

```typescript
const { currentUser, token, rooms, messages } = useChatStore();
```

**Qu'on y stocke :**
- `currentUser` : L'utilisateur connecté
- `token` : Le code de sécurité pour accéder à l'API
- `rooms` : Les salons disponibles
- `messages` : Les messages par salon
- `roomUsers` : Les utilisateurs connectés au salon
- `typingUsers` : Qui est en train d'écrire

**Pourquoi ?** Au lieu de passer les données entre composants, on y accède directement.

### 2. **Socket.IO (socket.ts)** - Communication temps réel

```typescript
const socket = initSocket(userId, username);

// Envoyer un message en temps réel
socket.emit('message:send', { roomId, content, username });

// Écouter les nouveaux messages
socket.on('message:new', (message) => {
  addMessage(message.roomId, message);
});
```

**Qu'est-ce que c'est ?**
- `emit` = envoyer des données au serveur
- `on` = recevoir des données du serveur

### 3. **Pages (app/)** 

#### `page.tsx` - Login/Register
**Qu'elle fait :**
- Affiche un formulaire de connexion/inscription
- Envoie les identifiants au backend
- Reçoit un token (code de sécurité)
- Redirige vers `/chat`

**Flux :**
```
Utilisateur rentre email + password
       ↓
Clic sur Login
       ↓
Requête POST vers /api/auth/login
       ↓
Backend vérifie identifiants
       ↓
Retourne token + user info
       ↓
Sauvegarde dans Zustand store
       ↓
Redirige vers /chat
```

#### `chat/page.tsx` - Page de Chat
**Qu'elle fait :**
- Affiche la liste des salons
- Affiche les messages du salon actif
- Input pour envoyer des messages
- Gère la connexion Socket.IO

**Flux :**
```
Utilisateur rejoint un salon
       ↓
emit('user:join') au serveur Socket
       ↓
Socket ajoute l'utilisateur au salon
       ↓
Broadcast : "X a rejoint le salon"
       ↓
Frontend reçoit et affiche
```

### 4. **Composants (components/)**

#### `ChatWindow.tsx` - Affichage des messages
```typescript
// Récupère les messages du salon actif
const roomMessages = messages[currentRoomId] || [];

// Affiche chaque message
roomMessages.map(msg => (
  <div className="...">
    {msg.content}  // Le texte du message
    {msg.username} // Qui l'a écrit
  </div>
))
```

**Logique :**
- Messages à droite = ceux de l'utilisateur connecté
- Messages à gauche = ceux des autres

#### `MessageInput.tsx` - Envoyer des messages
```typescript
const handleSend = () => {
  // 1. Émettre au serveur Socket
  socket.emit('message:send', {
    roomId: currentRoomId,
    content: message,
    username: currentUser.username
  });
  
  // 2. Vider l'input
  setMessage('');
};
```

**Bonus :** Détecte quand l'utilisateur tape (typing indicator)

#### `RoomList.tsx` - Liste des salons
```typescript
rooms.map(room => (
  <button onClick={() => setCurrentRoom(room.id)}>
    # {room.name}  // Affiche "# general", "# random", etc.
  </button>
))
```

**Logique :**
- Clic sur un salon → change le salon actif
- Salon actif = surligné en bleu

## 🔌 Intégration avec Socket.IO

**Quand un utilisateur envoie un message :**

```
Frontend (ChatWindow reçoit 'message:new')
       ↓
socket.on('message:new', (message) => {
  addMessage(message.roomId, message);  // Ajoute au store
})
       ↓
Store se met à jour (Zustand)
       ↓
ChatWindow se re-render (affiche le nouveau message)
```

---

# Backend (Express)

## ⚙️ Qu'est-ce que c'est ?

C'est le **cerveau** de votre app. Il gère :
- Authentification (login/register)
- Base de données
- Routes API
- Logique métier

## 📁 Structure des Fichiers

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts         # Connexion PostgreSQL
│   │
│   ├── models/                 # Définition des données
│   │   ├── User.ts            # Modèle utilisateur
│   │   ├── Message.ts         # Modèle message
│   │   ├── Room.ts            # Modèle salon
│   │   ├── RoomMember.ts       # Modèle membership
│   │   └── index.ts           # Export + relations
│   │
│   ├── routes/                # Endpoints API
│   │   ├── auth.ts            # /api/auth/login, register
│   │   └── rooms.ts           # /api/rooms
│   │
│   ├── middleware/
│   │   └── auth.ts            # Vérification du token JWT
│   │
│   └── index.ts               # Serveur principal
│
└── .env                        # Secrets (JWT_SECRET, DATABASE_URL)
```

## 🔑 Concepts Clés

### 1. **Modèles (Models)** - Définir les données

Un modèle = **comment on stocke les données en DB**

#### Exemple: User.ts

```typescript
export class User extends Model {
  public id!: string;
  public username!: string;
  public email!: string;
  public password!: string;      // Hashé, jamais stocké en clair
  public status!: 'online' | 'offline' | 'away';
}
```

**Qu'est-ce que c'est ?**
- `id` : Identifiant unique
- `username` : Nom d'utilisateur
- `email` : Email
- `password` : Mot de passe (sécurisé avec bcrypt)
- `status` : En ligne / Hors ligne / Absent

#### Exemple: Message.ts

```typescript
export class Message extends Model {
  public id!: string;
  public roomId!: string;        // Quel salon ?
  public userId!: string;        // Qui l'a écrit ?
  public content!: string;       // Le texte
  public createdAt?: Date;       // Quand ?
}
```

### 2. **Routes API** - Les "endpoints"

Une route = **une URL que le frontend appelle**

#### Authentification (`auth.ts`)

```
POST /api/auth/register
├─ Body: { username, email, password }
└─ Retourne: { user, token }

POST /api/auth/login
├─ Body: { email, password }
└─ Retourne: { user, token }

GET /api/auth/me
├─ Header: Authorization: Bearer <token>
└─ Retourne: { user details }
```

**Qu'elles font :**

1. **Register** - Créer un nouvel utilisateur
   ```
   Utilisateur envoie username + email + password
          ↓
   Backend hash le password (sécurité)
          ↓
   Crée l'utilisateur en DB
          ↓
   Génère un token JWT
          ↓
   Retourne token + user info
   ```

2. **Login** - Se connecter
   ```
   Utilisateur envoie email + password
          ↓
   Backend cherche l'user en DB
          ↓
   Vérifie que le password correspond
          ↓
   Génère un token JWT
          ↓
   Retourne token
   ```

3. **Me** - Vérifier qui est connecté
   ```
   Frontend envoie: Authorization: Bearer <token>
          ↓
   Backend vérifie le token
          ↓
   Retourne les infos de l'utilisateur
   ```

#### Salons (`rooms.ts`)

```
GET /api/rooms
├─ Retourne: liste de tous les salons

POST /api/rooms
├─ Body: { name, description, isPrivate }
├─ Header: Authorization: Bearer <token>
└─ Retourne: room créé

POST /api/rooms/:roomId/join
├─ Header: Authorization: Bearer <token>
└─ Ajoute l'utilisateur au salon

GET /api/rooms/:roomId/messages
├─ Retourne: tous les messages du salon
```

### 3. **Middleware Auth** - Protéger les routes

```typescript
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  // Vérifie que le token est valide
  const decoded = jwt.verify(token, JWT_SECRET);
  req.userId = decoded.userId;
  next();
};
```

**Qu'est-ce que c'est ?**
- Vérifie que chaque requête a un token valide
- Si oui → continue
- Si non → retourne erreur 401

**Pourquoi ?** Pour que seuls les utilisateurs connectés puissent accéder à `/api/rooms`, etc.

### 4. **Base de Données** - Où tout est stocké

```typescript
const sequelize = new Sequelize(
  process.env.DATABASE_URL,  // "postgresql://dev:devpassword@localhost:5432/messaging_db"
  { dialect: 'postgres' }
);
```

**Qu'est-ce que c'est ?**
- PostgreSQL = base de données relationnelle
- Sequelize = traducteur (convertit JS ↔ SQL)
- `.sync()` = crée les tables automatiquement

---

# Socket.IO

## 🔌 Qu'est-ce que c'est ?

C'est un serveur **dédié à la communication temps réel**. Contrairement à HTTP (requête-réponse), Socket.IO maintient une **connexion ouverte** bidirectionnelle.

**HTTP vs WebSocket :**
```
HTTP (REST API)          WebSocket (Socket.IO)
┌─────┐                  ┌─────────────────────┐
│ Req ├──> Server        │ Connexion ouverte   │
└─────┘  <──┤ Res        ├─────────────────────┤
│ Req ├──> Server    │ Event 1 ──> Server      │
└─────┘  <──┤ Res        │ Server ──> Event 2  │
           │ Event 3 ──> Server      │
Chaque requête = │ Server ──> Event 4  │
nouvelle connexion   Connexion permanente
```

## 📁 Structure des Fichiers

```
socket-server/
├── src/
│   ├── types.ts                # Types TypeScript
│   │
│   ├── rooms/
│   │   └── roomManager.ts      # Gère les salons
│   │
│   ├── events/
│   │   ├── messageEvents.ts    # Événements messages
│   │   ├── userEvents.ts       # Événements utilisateurs
│   │   └── typingEvents.ts     # Événements typing
│   │
│   └── index.ts                # Serveur principal
│
└── .env                        # Variables (SOCKET_PORT)
```

## 🔑 Concepts Clés

### 1. **Events** - Les "actions" Socket

Un event = **quelque chose qui se passe en temps réel**

#### Message Events

```typescript
// Frontend → Socket
socket.emit('message:send', {
  roomId: 'room_123',
  content: 'Bonjour !',
  username: 'Alice'
});

// Socket → Frontend (tout le salon)
io.to(roomId).emit('message:new', {
  id: 'msg_456',
  content: 'Bonjour !',
  username: 'Alice',
  createdAt: new Date()
});
```

**Flux :**
```
1. Frontend envoie message:send
2. Socket reçoit et crée l'objet Message
3. Socket envoie message:new à TOUS dans le salon
4. Frontend de chacun reçoit et affiche
```

#### User Events

```typescript
// Frontend → Socket
socket.emit('user:join', {
  roomId: 'room_123',
  userId: 'user_456',
  username: 'Alice'
});

// Socket → Tous les utilisateurs du salon
io.to(roomId).emit('user:joined', {
  user: { id, username, status: 'online' },
  totalUsers: 3
});
```

**Flux :**
```
1. Alice rejoint le salon
2. Socket enregistre Alice en DB (RoomMember)
3. Socket notifie tout le salon : "Alice a rejoint"
4. Tous les clients reçoivent et mettent à jour la liste
```

#### Typing Events

```typescript
// Frontend → Socket (l'utilisateur tape)
socket.emit('user:typing-start', {
  roomId: 'room_123',
  username: 'Alice'
});

// Socket → Tous les autres du salon
io.to(roomId).emit('user:typing-updated', {
  typingUsers: ['Alice', 'Bob']
});
```

**Flux :**
```
1. Alice commence à taper
2. Frontend envoie typing-start
3. Socket enregistre que Alice tape
4. Socket envoie la liste des qui tapent
5. Autres voient "Alice is typing..."
6. Alice arrête → emit typing-stop
7. Socket enlève Alice de la liste
```

### 2. **Room Manager** - Gérer les salons

```typescript
class RoomManager {
  private rooms: Map<string, Set<string>>;  // roomId → [userId1, userId2]
  private userRooms: Map<string, Set<string>>;  // userId → [roomId1, roomId2]
  
  joinRoom(roomId, userId) {
    // Ajoute userId à roomId
  }
  
  leaveRoom(roomId, userId) {
    // Enlève userId de roomId
  }
  
  getRoomUsers(roomId) {
    // Retourne tous les users du salon
  }
}
```

**Qu'est-ce que c'est ?**
- Garde en mémoire qui est dans quel salon
- Rapide (pas besoin de chercher en DB)
- Se vide quand le serveur redémarre (OK pour dev)

### 3. **Broadcast vs Emit**

```typescript
// Envoyer à TOUT LE MONDE
io.emit('message:new', message);

// Envoyer à UN SALON
io.to(roomId).emit('message:new', message);

// Envoyer À UN USER
io.to(socketId).emit('message:new', message);

// Envoyer À TOUS SAUF L'ÉMETTEUR
socket.broadcast.to(roomId).emit('user:joined', user);
```

---

# Base de Données

## 🗄️ Qu'est-ce que c'est ?

La base de données **stocke toutes les données** de votre app (utilisateurs, messages, salons).

```
PostgreSQL (Base de données)
│
├── Table: users
│   ├── id (UUID)
│   ├── username (TEXT)
│   ├── email (TEXT)
│   ├── password (TEXT - hashé)
│   └── status (ENUM: online/offline/away)
│
├── Table: rooms
│   ├── id (UUID)
│   ├── name (TEXT)
│   ├── description (TEXT)
│   ├── isPrivate (BOOLEAN)
│   └── createdById (UUID - foreign key)
│
├── Table: messages
│   ├── id (UUID)
│   ├── roomId (UUID - foreign key)
│   ├── userId (UUID - foreign key)
│   ├── content (TEXT)
│   └── createdAt (TIMESTAMP)
│
└── Table: room_members (jonction)
    ├── id (UUID)
    ├── roomId (UUID - foreign key)
    └── userId (UUID - foreign key)
```

## 🔑 Concepts

### Relations

```typescript
// Un utilisateur peut écrire PLUSIEURS messages
User.hasMany(Message);
Message.belongsTo(User);

// Un salon contient PLUSIEURS messages
Room.hasMany(Message);
Message.belongsTo(Room);

// Un salon a PLUSIEURS membres (Many-to-Many)
User.belongsToMany(Room, { through: RoomMember });
Room.belongsToMany(User, { through: RoomMember });
```

**Qu'est-ce que c'est ?**
- Définit comment les tables sont liées
- Permet de faire des requêtes "intelligentes"

### Exemple de requête

```typescript
// Récupérer un salon + tous ses messages + les users
const room = await Room.findByPk(roomId, {
  include: [
    { association: 'Messages', include: ['User'] }
  ]
});

// Retourne:
{
  id: 'room_123',
  name: 'general',
  Messages: [
    { id: 'msg_1', content: '...', User: { username: 'Alice' } },
    { id: 'msg_2', content: '...', User: { username: 'Bob' } }
  ]
}
```

---

# Flux de Communication

## Scénario: Alice envoie un message dans #general

```
┌─────────────┐              ┌──────────────┐              ┌─────────────┐
│  Frontend   │              │  Backend API │              │  Socket.IO  │
│  (Alice)    │              │  (Express)   │              │  (Temps réel)
└─────────────┘              └──────────────┘              └─────────────┘
      │                             │                             │
      │  1. emit('message:send')   │                             │
      ├────────────────────────────────────────────────────────> │
      │                             │                             │
      │                             │  2. Crée Message en DB      │
      │                             │  (via Socket, pas API)      │
      │                             │                             │
      │                      3. emit('message:new') À TOUT LE SALON
      │ <──────────────────────────────────────────────────────── │
      │                             │                             │
      │  4. Reçoit message:new      │                             │
      │  Ajoute au store Zustand    │                             │
      │  ChatWindow se re-render    │                             │
      │  Message apparaît !         │                             │
      │                             │                             │
      
(Même flux pour Bob dans le navigateur)
```

## Scénario: Bob se connecte

```
┌─────────────┐              ┌──────────────┐              ┌─────────────┐
│  Frontend   │              │  Backend API │              │  Socket.IO  │
│  (Bob)      │              │  (Express)   │              │  (Temps réel)
└─────────────┘              └──────────────┘              └─────────────┘
      │                             │                             │
      │  1. Clic sur Login          │                             │
      │                             │                             │
      │  2. POST /api/auth/login    │                             │
      ├────────────────────────────────────────────────────────> │
      │                             │                             │
      │                    3. Vérifie password                    │
      │                    Génère token JWT                       │
      │                             │                             │
      │ <──────────────────────────────────────────────────────── │
      │  4. Reçoit token            │                             │
      │  Sauvegarde en store        │                             │
      │  Redirige /chat             │                             │
      │                             │                             │
      │  5. Page /chat charge       │                             │
      │  initSocket(userId, username)                            │
      │  Crée la connexion WS       │                             │
      │  ─────────────────────────────────────────────────────> │
      │                             │                             │
      │                      6. Enregistre Bob en mémoire        │
      │                             │                             │
      │  7. emit('user:join')       │                             │
      ├────────────────────────────────────────────────────────> │
      │                             │                             │
      │                      8. Ajoute Bob au salon              │
      │                             │                             │
      │                   9. Notifie TOUS : "Bob a rejoint"
      │ <──────────────────────────────────────────────────────── │
      │                             │                             │
      │  10. Reçoit user:joined     │                             │
      │   Met à jour UserList       │                             │
      │   Liste s'actualise !       │                             │
      │                             │                             │
      
(Alice reçoit aussi l'événement et voit Bob a rejoint)
```

---

# Guide Pratique par Fonctionnalité

## 1️⃣ Ajouter un Nouveau Salons

**Où :** Backend (`routes/rooms.ts`)

```typescript
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, isPrivate } = req.body;
  
  // Crée le salon
  const room = await Room.create({
    name,
    description,
    isPrivate,
    createdById: req.userId  // Qui l'a créé
  });
  
  // Ajoute le créateur comme membre
  await RoomMember.create({
    roomId: room.id,
    userId: req.userId
  });
  
  res.status(201).json(room);
});
```

**Frontend:** Appeler depuis un formulaire

```typescript
const createRoom = async (name: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/rooms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // Token du store
      },
      body: JSON.stringify({ name, isPrivate: false })
    }
  );
  
  const newRoom = await response.json();
  useChatStore().addRoom(newRoom);
};
```

## 2️⃣ Ajouter Une Réaction Emoji sur Un Message

**Où :** Socket.IO (`events/messageEvents.ts`)

```typescript
socket.on('message:react', (data) => {
  const { messageId, roomId, emoji } = data;
  
  // Broadcast à tous les utilisateurs du salon
  io.to(roomId).emit('message:reaction-added', {
    messageId,
    emoji,
    userId: socket.id
  });
});
```

**Frontend:** Ajouter le bouton dans `ChatWindow.tsx`

```typescript
<button
  onClick={() => socket.emit('message:react', {
    messageId: msg.id,
    roomId: currentRoomId,
    emoji: '👍'
  })}
>
  👍
</button>
```

## 3️⃣ Ajouter Une Recherche de Messages

**Où :** Backend (`routes/rooms.ts`)

```typescript
router.get('/:roomId/messages/search', authMiddleware, async (req, res) => {
  const { q } = req.query;  // ?q=bonjour
  
  const messages = await Message.findAll({
    where: {
      roomId: req.params.roomId,
      content: {
        [Op.iLike]: `%${q}%`  // Recherche "insensible à la casse"
      }
    }
  });
  
  res.json(messages);
});
```

**Frontend:** Ajouter un input de recherche

```typescript
const [searchTerm, setSearchTerm] = useState('');

const searchMessages = async () => {
  const res = await fetch(
    `${API_URL}/api/rooms/${roomId}/messages/search?q=${searchTerm}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const results = await res.json();
  setSearchResults(results);
};
```

## 4️⃣ Afficher le Statut Utilisateur (Online/Offline)

**Où :** Socket.IO (`events/userEvents.ts`)

```typescript
socket.on('disconnect', () => {
  const userRooms = roomManager.getUserRooms(socket.id);
  
  userRooms.forEach(roomId => {
    // Notifie que l'user est offline
    io.to(roomId).emit('user:status-changed', {
      userId: socket.id,
      status: 'offline'
    });
  });
});
```

**Frontend:** Mettre à jour le store et afficher

```typescript
socket.on('user:status-changed', (data) => {
  // Mettre à jour la liste des users
  const updatedUsers = roomUsers.map(u =>
    u.id === data.userId ? { ...u, status: data.status } : u
  );
  setRoomUsers(updatedUsers);
});

// Dans le component
<span className={user.status === 'online' ? 'text-green-500' : 'text-gray-400'}>
  ● {user.username}
</span>
```

---

# Checklists de Développement

## Avant de Commencer à Coder
- [ ] Docker running (`docker ps`)
- [ ] `.env` créé avec bonnes valeurs
- [ ] `npm install` sans erreurs dans chaque dossier
- [ ] Serveurs lancent sans erreurs
- [ ] Frontend accessible sur http://localhost:3000

## Quand vous Ajoutez une Fonctionnalité

1. **Backend** : Créer la route/logique
2. **Socket.IO** : Créer l'event si temps réel
3. **Frontend** : Créer le composant/appel
4. **Test** : Vérifier que ça marche

## Debugging

**Frontend ne reçoit pas les messages ?**
```typescript
// Dans console du navigateur
socket.on('message:new', (msg) => {
  console.log('Message reçu:', msg);  // Vérifier
});
```

**Backend retourne erreur 401 ?**
```typescript
// Vérifier le token
const token = localStorage.getItem('token');  // Frontend
console.log('Token:', token);
```

**Socket non connecté ?**
```typescript
// Vérifier la connexion
socket.on('connection:success', (data) => {
  console.log('Socket connecté:', data.socketId);
});
```

---

Bonne chance ! 🚀 N'hésitez pas à poser des questions ! 💬