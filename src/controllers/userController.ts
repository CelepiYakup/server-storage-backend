import { Request, Response } from "express";
import { UserModel, UserInput } from "../models/userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class UserController {
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: UserInput = req.body;

      const existingUserByEmail = await UserModel.getUserByEmail(
        userData.email
      );
      if (existingUserByEmail) {
        res
          .status(400)
          .json({
            message: "Email already registered. Please use a different email.",
          });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const newUser = await UserModel.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = newUser;

      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, email: newUser.email },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "1d" }
      );

      res.status(201).json({
        message: "User registered successfully",
        user: {
          ...userWithoutPassword,
          token,
        },
      });
    } catch (error: any) {
      console.error("Error registering user:", error);

      if (error.code === "23505") {
        if (error.constraint === "users_email_key") {
          res
            .status(400)
            .json({
              message:
                "Email already registered. Please use a different email.",
            });
        } else if (error.constraint === "users_username_key") {
          res
            .status(400)
            .json({
              message:
                "Username already taken. Please choose a different username.",
            });
        } else {
          res
            .status(400)
            .json({ message: "User with these details already exists." });
        }
        return;
      }

      res
        .status(500)
        .json({
          message: "Server error during registration. Please try again later.",
        });
    }
  }

  // Login user
  static async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const user = await UserModel.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "1d" }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: "Login successful",
        user: {
          ...userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      if (req.user && req.user.id !== userId) {
        res
          .status(403)
          .json({
            message: "Access denied. You can only view your own account.",
          });
        return;
      }

      const user = await UserModel.getUserById(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const { password, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const userData: Partial<UserInput> = req.body;

      if (isNaN(userId)) {
        res.status(400).json({ message: "Geçersiz kullanıcı ID" });
        return;
      }

      if (req.user && req.user.id !== userId) {
        res
          .status(403)
          .json({
            message: "Access denied. You can only update your own account.",
          });
        return;
      }

      const existingUser = await UserModel.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const updatedUser = await UserModel.updateUser(userId, userData);

      if (!updatedUser) {
        res.status(400).json({ message: "Güncellenecek alan bulunamadı" });
        return;
      }

      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        message: "User updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      if (req.user && req.user.id !== userId) {
        res
          .status(403)
          .json({
            message: "Access denied. You can only delete your own account.",
          });
        return;
      }

      // Check if user exists
      const existingUser = await UserModel.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const deleted = await UserModel.deleteUser(userId);

      if (!deleted) {
        res.status(500).json({ message: "User not deleted" });
        return;
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}
