import User from './User';
import Room from './Room';
import Message from './Messages';
import RoomMember from './RoomMember';

// Define relationships
User.hasMany(Message, { foreignKey: 'userId', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'userId' });

Room.hasMany(Message, { foreignKey: 'roomId', onDelete: 'CASCADE' });
Message.belongsTo(Room, { foreignKey: 'roomId' });

User.hasMany(Room, { foreignKey: 'createdById', onDelete: 'CASCADE' });
Room.belongsTo(User, { foreignKey: 'createdById' });

User.belongsToMany(Room, { through: RoomMember, foreignKey: 'userId' });
Room.belongsToMany(User, { through: RoomMember, foreignKey: 'roomId' });

RoomMember.belongsTo(User, { foreignKey: 'userId' });
RoomMember.belongsTo(Room, { foreignKey: 'roomId' });

export { User, Room, Message, RoomMember };