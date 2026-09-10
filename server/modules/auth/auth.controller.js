import { AuthService } from './auth.service.js';
import { loginSchema } from './auth.validator.js';

const isProduction = process.env.NODE_ENV === 'production';

export class AuthController {
  static async login(req, res, next) {
    try {
      const validated = loginSchema.parse(req.body);
      const { admin, accessToken, refreshToken } = await AuthService.login(
        validated.email,
        validated.password
      );

      // Set refresh token in httpOnly cookie (7 days)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        data: {
          admin,
          accessToken
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors
          }
        });
      }
      return res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Internal server error' }
      });
    }
  }

  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: { message: 'No refresh token provided' }
        });
      }

      const { admin, accessToken } = await AuthService.refresh(refreshToken);

      return res.status(200).json({
        success: true,
        data: {
          admin,
          accessToken
        }
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to refresh token' }
      });
    }
  }

  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const accessToken = req.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

      await AuthService.logout({ refreshToken, accessToken });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      });

      return res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Logout failed' }
      });
    }
  }

  static async me(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        admin: req.admin
      }
    });
  }
}
