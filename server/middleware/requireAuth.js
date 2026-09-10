import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { isTokenBlacklisted } from '../lib/redis.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_change_in_production_32char';

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No token provided.' }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired access token.' }
      });
    }

    // Check if blacklisted in Redis
    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token has been revoked.' }
      });
    }

    // Verify admin is active
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'User account is inactive or no longer exists.' }
      });
    }

    req.admin = admin;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
