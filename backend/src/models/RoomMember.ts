import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class RoomMember extends Model {
  declare id: string;
  declare roomId: string;
  declare userId: string;
  declare joinedAt: Date;
}

RoomMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RoomMember',
    tableName: 'room_members',
    timestamps: false,
  }
);

export default RoomMember;