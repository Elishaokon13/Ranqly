import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BlockchainService } from '../services/blockchain';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    token?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    
    // Verify wallet signature if provided
    if (decoded.address) {
      // Check if address is valid Ethereum address
      const isValidAddress = await BlockchainService.getInstance().isAddressValid(decoded.address);
      if (!isValidAddress) {
        res.status(401).json({
          success: false,
          error: 'Invalid wallet address'
        });
        return;
      }

      req.user = {
        address: decoded.address,
        token
      };
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      if (decoded.address) {
        const isValidAddress = await BlockchainService.getInstance().isAddressValid(decoded.address);
        if (isValidAddress) {
          req.user = {
            address: decoded.address,
            token
          };
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

export const generateAuthToken = (address: string): string => {
  const payload = {
    address,
    timestamp: Date.now()
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '7d'
  });
};

export const verifyWalletSignature = async (
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> => {
  try {
    return await BlockchainService.getInstance().validateWalletSignature(
      message,
      signature,
      expectedAddress
    );
  } catch (error) {
    logger.error('Wallet signature verification error:', error);
    return false;
  }
};