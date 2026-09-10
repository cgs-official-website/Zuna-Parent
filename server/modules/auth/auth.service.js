import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { blacklistToken, isTokenBlacklisted } from '../../lib/redis.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_change_in_production_32char';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_in_production_32char';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export class AuthService {
  /**
   * Generate access and refresh token pair
   */
  static generateTokens(admin) {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        jti: accessJti
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: admin.id,
        jti: refreshJti
      },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken, accessJti, refreshJti };
  }

  /**
   * Authenticate admin via email and password
   */
  static async login(email, password) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!admin.isActive) {
      const error = new Error('Account is deactivated. Contact a Super Admin.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    const { accessToken, refreshToken } = this.generateTokens(admin);

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Rotate access token from refresh token
   */
  static async refresh(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      throw error;
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    // Check if blacklisted
    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      const error = new Error('Refresh token has been revoked');
      error.statusCode = 401;
      throw error;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id }
    });

    if (!admin || !admin.isActive) {
      const error = new Error('Account not found or deactivated');
      error.statusCode = 401;
      throw error;
    }

    // Generate new access token
    const accessJti = crypto.randomUUID();
    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        jti: accessJti
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl
      },
      accessToken
    };
  }

  /**
   * Logout and invalidate refresh token
   */
  static async logout({ refreshToken, accessToken }) {
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        if (decodedRefresh.jti) {
          const remainingSecs = Math.max(decodedRefresh.exp - Math.floor(Date.now() / 1000), 60);
          await blacklistToken(decodedRefresh.jti, remainingSecs);
        }
      } catch (err) {
        // Token was invalid or expired anyway
      }
    }

    if (accessToken) {
      try {
        const decodedAccess = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        if (decodedAccess.jti) {
          const remainingSecs = Math.max(decodedAccess.exp - Math.floor(Date.now() / 1000), 60);
          await blacklistToken(decodedAccess.jti, remainingSecs);
        }
      } catch (err) {
        // Token was invalid or expired anyway
      }
    }

    return true;
  }
}
