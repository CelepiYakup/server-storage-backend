import { pool } from '../config/db';

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  role: UserRole;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class UserModel {

  static async createUser(userData: UserInput): Promise<User> {
    const { username, email, password, role } = userData;

    const userRole = role || 'user';

    
    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [username, email, password, userRole];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }


  static async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }


  static async getUserByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    const query = 'SELECT id, username, email, created_at FROM users';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  static async updateUser(id: string, userData: Partial<UserInput>): Promise<User | null> {
    const { username, email, password, role } = userData;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (username) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    
    if (password) {
      updates.push(`password = $${paramCount}`);
      values.push(password);
      paramCount++;
    }

    if (role){
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return null; 
    }
    
    values.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }


  static async deleteUser(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
} 