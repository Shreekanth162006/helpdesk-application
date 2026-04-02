import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';
import bcrypt from 'bcryptjs';

export class User extends Model {
  async comparePassword(plain) {
    return bcrypt.compare(plain, this.password);
  }

  toJSON() {
    const o = this.get();
    delete o.password;
    return o;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'Customer' }, // Super Admin, Admin, Manager, Agent, Customer
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    language: { type: DataTypes.STRING, defaultValue: 'en' },
    approvalStatus: {
      type: DataTypes.STRING,
      defaultValue: 'approved',
    }, // pending | approved | rejected (for official accounts created via login)
  },
  { sequelize, modelName: 'user', underscored: true, timestamps: true }
);

User.beforeCreate(async (u) => {
  if (u.password) u.password = await bcrypt.hash(u.password, 10);
});
User.beforeUpdate(async (u) => {
  if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10);
});
