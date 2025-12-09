import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Room extends Model {
  declare id: string;
  declare name: string;
  declare description: string;
  declare isPrivate: boolean;
  declare createdById: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Room.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // FIX: Use a setter to manually trim the value before saving
      set(value: string) {
        this.setDataValue('name', value ? value.trim() : value);
      },
      validate: {
        len: [2, 50],
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    timestamps: true,
  }
);

export default Room;