import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from './rate-limiter';
import type { Database } from '../db/client';
import type { SecurityRepository } from '../db/repositories/security.repository';

// Mock SecurityRepository
const mockSecurityRepo = {
  checkRateLimit: vi.fn(),
  cleanupExpiredRateLimits: vi.fn(),
} as unknown as SecurityRepository;

// Mock Database
const mockDb = {} as Database;

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    limiter = new RateLimiter(mockDb);
    // Replace the internal repo with our mock
    (limiter as any).repo = mockSecurityRepo;
  });

  describe('check', () => {
    it('allows request when under limit', async () => {
      mockSecurityRepo.checkRateLimit = vi.fn().mockResolvedValue({
        allowed: true,
        current: 3,
      });

      const result = await limiter.check('user123', 'generation:initial_plan');

      expect(result).toEqual({
        allowed: true,
        current: 3,
        limit: 5,
      });

      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user123',
        'generation:initial_plan',
        5,
        3600_000
      );
    });

    it('denies request when at limit', async () => {
      mockSecurityRepo.checkRateLimit = vi.fn().mockResolvedValue({
        allowed: false,
        current: 5,
      });

      const result = await limiter.check('user123', 'generation:initial_plan');

      expect(result).toEqual({
        allowed: false,
        current: 5,
        limit: 5,
      });
    });

    it('throws error for unknown bucket', async () => {
      await expect(
        limiter.check('user123', 'unknown:bucket' as any)
      ).rejects.toThrow('Unknown rate limit bucket: unknown:bucket');
    });

    it('respects different limits for different buckets', async () => {
      mockSecurityRepo.checkRateLimit = vi.fn().mockResolvedValue({
        allowed: true,
        current: 1,
      });

      // Check generation:chat (50 per hour)
      await limiter.check('user123', 'generation:chat');
      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user123',
        'generation:chat',
        50,
        3600_000
      );

      // Check api:create_event (10 per hour)
      await limiter.check('user123', 'api:create_event');
      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user123',
        'api:create_event',
        10,
        3600_000
      );

      // Check api:create_expense (100 per hour)
      await limiter.check('user123', 'api:create_expense');
      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user123',
        'api:create_expense',
        100,
        3600_000
      );
    });

    it('handles multiple users independently', async () => {
      mockSecurityRepo.checkRateLimit = vi.fn().mockResolvedValue({
        allowed: true,
        current: 1,
      });

      await limiter.check('user1', 'generation:initial_plan');
      await limiter.check('user2', 'generation:initial_plan');

      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user1',
        'generation:initial_plan',
        5,
        3600_000
      );

      expect(mockSecurityRepo.checkRateLimit).toHaveBeenCalledWith(
        'user2',
        'generation:initial_plan',
        5,
        3600_000
      );
    });
  });

  describe('cleanup', () => {
    it('returns number of deleted entries', async () => {
      mockSecurityRepo.cleanupExpiredRateLimits = vi.fn().mockResolvedValue(42);

      const result = await limiter.cleanup();

      expect(result).toBe(42);
      expect(mockSecurityRepo.cleanupExpiredRateLimits).toHaveBeenCalledOnce();
    });

    it('handles cleanup with no expired entries', async () => {
      mockSecurityRepo.cleanupExpiredRateLimits = vi.fn().mockResolvedValue(0);

      const result = await limiter.cleanup();

      expect(result).toBe(0);
    });
  });
});
