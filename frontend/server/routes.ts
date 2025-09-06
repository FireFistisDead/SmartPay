import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { loginSchema, signupSchema, type LoginRequest, type SignupRequest } from "@shared/schema";
import cors from "cors";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Email sending utility (simplified for now)
const sendVerificationEmail = async (email: string, token: string) => {
  // In production, integrate with a service like SendGrid, Nodemailer, etc.
  console.log(`Verification email would be sent to ${email} with token: ${token}`);
  console.log(`Verification URL: http://localhost:5000/verify-email?token=${token}`);
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors());
  
  // Signup endpoint
  app.post("/api/auth/signup", 
    [
      body("email").isEmail().normalizeEmail(),
      body("password").isLength({ min: 6 }),
      body("username").isLength({ min: 3 }),
      body("role").isIn(["client", "freelancer"]),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ 
            success: false, 
            message: "Validation failed", 
            errors: errors.array() 
          });
        }

        const { email, password, username, role }: SignupRequest = req.body;

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ 
            success: false, 
            message: "User with this email already exists" 
          });
        }

        // Create new user
        const newUser = await storage.createUser({
          email,
          password,
          username,
          role,
        });

        // Send verification email
        if (newUser.verificationToken) {
          await sendVerificationEmail(email, newUser.verificationToken);
        }

        // Remove sensitive data before sending response
        const { password: _, verificationToken, ...userResponse } = newUser;

        res.status(201).json({
          success: true,
          message: "User created successfully. Please check your email for verification.",
          user: userResponse,
        });
      } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  );

  // Login endpoint
  app.post("/api/auth/login",
    [
      body("email").isEmail().normalizeEmail(),
      body("password").notEmpty(),
      body("role").isIn(["client", "freelancer"]),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ 
            success: false, 
            message: "Validation failed", 
            errors: errors.array() 
          });
        }

        const { email, password, role }: LoginRequest = req.body;

        // Find user by email
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials" 
          });
        }

        // Check if user role matches
        if (user.role !== role) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid role for this account" 
          });
        }

        // Verify password
        if (!user.password || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials" 
          });
        }

        // Check if email is verified
        if (!user.emailVerified) {
          return res.status(401).json({ 
            success: false, 
            message: "Please verify your email before logging in" 
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Remove sensitive data before sending response
        const { password: _, verificationToken, resetPasswordToken, ...userResponse } = user;

        res.json({
          success: true,
          message: "Login successful",
          token,
          user: userResponse,
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  );

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid verification token" 
        });
      }

      const user = await storage.verifyUserEmail(token);
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired verification token" 
        });
      }

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Google Auth endpoint
  app.post("/api/auth/google",
    [
      body("googleId").notEmpty(),
      body("email").isEmail().normalizeEmail(),
      body("username").notEmpty(),
      body("role").isIn(["client", "freelancer"]),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ 
            success: false, 
            message: "Validation failed", 
            errors: errors.array() 
          });
        }

        const { googleId, email, username, role } = req.body;

        // Check if user already exists with Google ID
        let user = await storage.getUserByGoogleId(googleId);
        
        if (!user) {
          // Check if user exists with email
          user = await storage.getUserByEmail(email);
          
          if (user && !user.googleId) {
            // Link Google account to existing user
            user = await storage.updateUser(user.id, { googleId });
          } else if (!user) {
            // Create new user with Google Auth
            user = await storage.createUser({
              email,
              username,
              role,
              googleId,
              // No password for Google auth users
            });
            
            // Auto-verify email for Google users
            if (user) {
              user = await storage.updateUser(user.id, { emailVerified: true });
            }
          }
        }

        if (!user) {
          return res.status(500).json({ 
            success: false, 
            message: "Failed to create or find user" 
          });
        }

        // Check if user role matches
        if (user.role !== role) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid role for this account" 
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Remove sensitive data before sending response
        const { password: _, verificationToken, resetPasswordToken, ...userResponse } = user;

        res.json({
          success: true,
          message: "Google login successful",
          token,
          user: userResponse,
        });
      } catch (error) {
        console.error("Google auth error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  );

  // Get current user endpoint (requires authentication)
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ 
          success: false, 
          message: "No token provided" 
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Remove sensitive data
      const { password, verificationToken, resetPasswordToken, ...userResponse } = user;

      res.json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
