/**
 * Authentication routes for Ranqly Backend
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/shared/database/connection';
import { asyncHandler, AppError } from '@/shared/middleware/errorHandler';
import { ApiResponse, LoginRequest, CreateUserRequest, User } from '@/shared/types';
import winston from 'winston';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import configManager from '@/shared/utils/config';

export function authRoutes(databaseService: DatabaseService, logger: winston.Logger): Router {
  const router = Router();
  const config = configManager.getConfig();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, username, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *               password:
   *                 type: string
   *                 minLength: 8
   *               walletAddress:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Bad request
   *       409:
   *         description: User already exists
   */
  router.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password, walletAddress }: CreateUserRequest = req.body;

    // Validate input
    if (!email || !username || !password) {
      throw new AppError('Email, username, and password are required', 400, 'VALIDATION_ERROR');
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await databaseService.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email or username already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await databaseService.query(
      `INSERT INTO users (email, username, password_hash, wallet_address, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, email, username, role, wallet_address, is_active, created_at, updated_at`,
      [email, username, passwordHash, walletAddress]
    );

    const user: User = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      username: result.rows[0].username,
      role: result.rows[0].role,
      walletAddress: result.rows[0].wallet_address,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };

    res.status(201).json(response);
  }));

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     expiresIn:
   *                       type: number
   *       401:
   *         description: Invalid credentials
   */
  router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const result = await databaseService.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const userRow = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userRow.id, 
        email: userRow.email, 
        role: userRow.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: userRow.id },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      role: userRow.role,
      walletAddress: userRow.wallet_address,
      isActive: userRow.is_active,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        token,
        refreshToken,
        expiresIn: 86400, // 24 hours in seconds
      },
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };

    res.json(response);
  }));

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   */
  router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const result = await databaseService.query(
      'SELECT id, email, username, role, wallet_address, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const userRow = result.rows[0];
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      role: userRow.role,
      walletAddress: userRow.wallet_address,
      isActive: userRow.is_active,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };

    res.json(response);
  }));

  return router;
}

export default authRoutes;


