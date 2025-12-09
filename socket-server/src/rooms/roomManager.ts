/**
 * RoomManager - Gère les utilisateurs dans les salons
 * 
 * Garde en mémoire:
 * - Quels utilisateurs sont dans quels salons
 * - Quels salons un utilisateur a rejoint
 */

interface RoomUser {
  userId: string;
  username: string;
  joinedAt: Date;
}

export class RoomManager {
  // Map: roomId -> Set d'utilisateurs
  private rooms: Map<string, Map<string, RoomUser>>;
  
  // Map: userId -> Set de roomIds
  private userRooms: Map<string, Set<string>>;

  constructor() {
    this.rooms = new Map();
    this.userRooms = new Map();
  }

  /**
   * Ajouter un utilisateur à un salon
   */
  addUserToRoom(roomId: string, userId: string, username: string): void {
    // Initialiser le salon s'il n'existe pas
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    // Ajouter l'utilisateur au salon
    this.rooms.get(roomId)!.set(userId, {
      userId,
      username,
      joinedAt: new Date(),
    });

    // Initialiser les salons de l'utilisateur s'ils n'existent pas
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }

    // Ajouter le salon à la liste des salons de l'utilisateur
    this.userRooms.get(userId)!.add(roomId);

    console.log(`📍 RoomManager: ${username} added to room ${roomId}`);
  }

  /**
   * Retirer un utilisateur d'un salon
   */
  removeUserFromRoom(roomId: string, userId: string): void {
    // Retirer du salon
    if (this.rooms.has(roomId)) {
      const username = this.rooms.get(roomId)!.get(userId)?.username || 'Unknown';
      this.rooms.get(roomId)!.delete(userId);

      // Si le salon est vide, le supprimer
      if (this.rooms.get(roomId)!.size === 0) {
        this.rooms.delete(roomId);
      }

      console.log(`📍 RoomManager: ${username} removed from room ${roomId}`);
    }

    // Retirer de la liste des salons de l'utilisateur
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(roomId);

      // Si l'utilisateur n'a plus de salons, le supprimer
      if (this.userRooms.get(userId)!.size === 0) {
        this.userRooms.delete(userId);
      }
    }
  }

  /**
   * Obtenir tous les utilisateurs d'un salon
   */
  getRoomUsers(roomId: string): RoomUser[] {
    if (!this.rooms.has(roomId)) {
      return [];
    }

    return Array.from(this.rooms.get(roomId)!.values());
  }

  /**
   * Obtenir tous les salons d'un utilisateur
   */
  getUserRooms(userId: string): string[] {
    if (!this.userRooms.has(userId)) {
      return [];
    }

    return Array.from(this.userRooms.get(userId)!);
  }

  /**
   * Vérifier si un utilisateur est dans un salon
   */
  isUserInRoom(roomId: string, userId: string): boolean {
    return this.rooms.has(roomId) && this.rooms.get(roomId)!.has(userId);
  }

  /**
   * Obtenir le nombre d'utilisateurs dans un salon
   */
  getRoomUserCount(roomId: string): number {
    if (!this.rooms.has(roomId)) {
      return 0;
    }

    return this.rooms.get(roomId)!.size;
  }

  /**
   * Obtenir tous les salons actifs
   */
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Obtenir le nombre de salons actifs
   */
  getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * Obtenir tous les utilisateurs connectés
   */
  getAllConnectedUsers(): string[] {
    return Array.from(this.userRooms.keys());
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  getConnectedUsersCount(): number {
    return this.userRooms.size;
  }

  /**
   * Nettoyer un utilisateur de tous ses salons (lors de la déconnexion)
   */
  removeUserFromAllRooms(userId: string): void {
    const rooms = this.getUserRooms(userId);
    
    rooms.forEach((roomId) => {
      this.removeUserFromRoom(roomId, userId);
    });

    console.log(`📍 RoomManager: User ${userId} removed from all rooms`);
  }

  /**
   * Obtenir des statistiques
   */
  getStats(): {
    totalRooms: number;
    totalUsers: number;
    roomDetails: { roomId: string; userCount: number }[];
  } {
    const roomDetails = Array.from(this.rooms.entries()).map(([roomId, users]) => ({
      roomId,
      userCount: users.size,
    }));

    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userRooms.size,
      roomDetails,
    };
  }

  /**
   * Afficher l'état actuel (pour le debug)
   */
  printState(): void {
    console.log('\n📊 Room Manager State:');
    console.log('======================');
    console.log(`Total rooms: ${this.rooms.size}`);
    console.log(`Total users: ${this.userRooms.size}`);
    console.log('\nRooms:');
    this.rooms.forEach((users, roomId) => {
      console.log(`  ${roomId}: ${users.size} users`);
      users.forEach((user) => {
        console.log(`    - ${user.username} (${user.userId})`);
      });
    });
    console.log('======================\n');
  }
}