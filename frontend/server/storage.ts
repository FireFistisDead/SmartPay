import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  verifyUserEmail(token: string): Promise<User | undefined>;
  updatePassword(email: string, hashedPassword: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const verificationToken = randomUUID();
    
    // Hash password if provided
    let hashedPassword = undefined;
    if (insertUser.password) {
      hashedPassword = await bcrypt.hash(insertUser.password, 12);
    }

    const user: User = { 
      id,
      email: insertUser.email,
      password: hashedPassword || null,
      username: insertUser.username,
      role: insertUser.role,
      googleId: insertUser.googleId || null,
      emailVerified: false,
      verificationToken,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUserEmail(token: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (u) => u.verificationToken === token,
    );
    
    if (user) {
      const updatedUser = { 
        ...user, 
        emailVerified: true, 
        verificationToken: null,
        updatedAt: new Date()
      };
      this.users.set(user.id, updatedUser);
      return updatedUser;
    }
    
    return undefined;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;

    const updatedUser = { 
      ...user, 
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date()
    };
    this.users.set(user.id, updatedUser);
    return true;
  }
}

export const storage = new MemStorage();
