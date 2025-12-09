-- ============================================
-- Script d'initialisation de la base de données EasyChat
-- Ce fichier est exécuté automatiquement au premier démarrage de PostgreSQL
-- ============================================

-- Créer l'extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (char_length(username) >= 3),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL CHECK (char_length(password) >= 6),
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: rooms
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(name) >= 2),
    description VARCHAR(255),
    is_private BOOLEAN DEFAULT FALSE,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_room_creator FOREIGN KEY (created_by_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- ============================================
-- TABLE: messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_message_room FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_message_user FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- ============================================
-- TABLE: room_members (Many-to-Many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_room_member_room FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_room_member_user FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_room_user UNIQUE(room_id, user_id)
);

-- ============================================
-- INDEXES pour améliorer les performances
-- ============================================

-- Index sur les messages (les requêtes les plus fréquentes)
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);

-- Index sur les membres des rooms
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_joined_at ON room_members(joined_at DESC);

-- Index sur les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Index sur les rooms
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
CREATE INDEX IF NOT EXISTS idx_rooms_creator ON rooms(created_by_id);
CREATE INDEX IF NOT EXISTS idx_rooms_private ON rooms(is_private);

-- ============================================
-- FONCTION: Mettre à jour updated_at automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUE: Messages avec informations utilisateur
-- ============================================
CREATE OR REPLACE VIEW messages_with_user AS
SELECT 
    m.id,
    m.room_id,
    m.user_id,
    m.content,
    m.created_at,
    m.updated_at,
    u.username,
    u.email,
    u.status as user_status
FROM messages m
INNER JOIN users u ON m.user_id = u.id;

-- ============================================
-- VUE: Statistiques des rooms
-- ============================================
CREATE OR REPLACE VIEW room_statistics AS
SELECT 
    r.id as room_id,
    r.name as room_name,
    r.description,
    r.is_private,
    COUNT(DISTINCT rm.user_id) as member_count,
    COUNT(DISTINCT m.id) as message_count,
    MAX(m.created_at) as last_message_at,
    r.created_at
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
LEFT JOIN messages m ON r.id = m.room_id
GROUP BY r.id, r.name, r.description, r.is_private, r.created_at;

-- ============================================
-- FONCTION: Obtenir les statistiques globales
-- ============================================
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    total_users BIGINT,
    online_users BIGINT,
    total_rooms BIGINT,
    public_rooms BIGINT,
    private_rooms BIGINT,
    total_messages BIGINT,
    total_room_members BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'online') as online_users,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM rooms WHERE is_private = false) as public_rooms,
        (SELECT COUNT(*) FROM rooms WHERE is_private = true) as private_rooms,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM room_members) as total_room_members;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MESSAGES DE CONFIRMATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database initialized successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables created:';
    RAISE NOTICE '   • users';
    RAISE NOTICE '   • rooms';
    RAISE NOTICE '   • messages';
    RAISE NOTICE '   • room_members';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Views created:';
    RAISE NOTICE '   • messages_with_user';
    RAISE NOTICE '   • room_statistics';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🔄 Triggers created for auto-update';
    RAISE NOTICE '📈 Statistics function: get_database_stats()';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;