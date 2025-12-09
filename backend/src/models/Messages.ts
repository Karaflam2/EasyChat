import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Message extends Model {
  declare id: string;
  declare roomId: string;
  declare userId: string;
  declare content: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare username?: string;
}

Message.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
  }
);

export default Message;