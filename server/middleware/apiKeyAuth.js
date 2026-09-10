import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { checkSlidingWindowRateLimit } from '../lib/redis.js';

export async function apiKeyAuth(req, res, next) {
  try {
    const rawApiKey = req.headers['x-api-key'];

    if (!rawApiKey || typeof rawApiKey !== 'string' || !rawApiKey.trim()) {
      return res.status(401).json({
        success: false,
        error: { message: 'Missing X-Api-Key authentication header.' }
      });
    }

    // Compute SHA-256 hash
    const keyHash = crypto.createHash('sha256').update(rawApiKey.trim()).digest('hex');

    // Rate Limit: 30 requests / minute per API key via Redis sliding window
    const rateLimit = await checkSlidingWindowRateLimit(`rl:apikey:${keyHash}`, 30, 60);

    res.setHeader('X-RateLimit-Limit', '30');
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));

    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        success: false,
        error: { message: 'Rate limit exceeded: Maximum 30 requests per minute per API key.' }
      });
    }

    // Look up key in ApiKey table
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        product: true
      }
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or inactive API key.' }
      });
    }

    // Update lastUsedAt asynchronously
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    req.apiKey = apiKeyRecord;
    req.product = apiKeyRecord.product;

    next();
  } catch (error) {
    next(error);
  }
}
