import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export class User extends Model {
  declare id: string;
  declare username: string;
  declare email: string;
  declare password: string;
  declare status: 'online' | 'offline' | 'away';
  declare createdAt: Date;
  declare updatedAt: Date;

  // Instance method to check password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Get user without sensitive data
  toJSON() {
    const user = super.toJSON();
    // Use the `delete` operator on the result of `super.toJSON()`
    delete (user as any).password; 
    return user;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // Implement trim via a setter
      set(value: string) {
        this.setDataValue('username', value ? value.trim() : value);
      },
      validate: {
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // Implement lowercase via a setter
      set(value: string) {
        this.setDataValue('email', value ? value.toLowerCase() : value);
      },
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'away'),
      defaultValue: 'offline',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        // Hash password before saving to the database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user: User) => {
        // Only hash if the password has been modified (e.g., in a password change operation)
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;