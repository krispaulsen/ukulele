import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { attachUser, requireAuth } from './middleware.js';
import { config } from './config.js';

const TOKEN_COOKIE = 'session';

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    clearCookie: vi.fn()
  };
}

describe('attachUser', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    res = createMockRes();
    next = vi.fn();
  });

  it('sets req.user = null and calls next when no cookie', () => {
    req = { cookies: {} };

    attachUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets req.user = null for invalid token', () => {
    req = { cookies: { [TOKEN_COOKIE]: 'not-a-valid-jwt' } };

    attachUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets req.user from valid JWT', () => {
    const payload = { userId: 'user-xyz-123' };
    const token = jwt.sign(payload, config.sessionSecret, { expiresIn: '1h' });
    req = { cookies: { [TOKEN_COOKIE]: token } };

    attachUser(req, res, next);

    expect(req.user).toBeTruthy();
    expect(req.user.userId).toBe('user-xyz-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets req.user = null when token signature is wrong', () => {
    const token = jwt.sign({ userId: 'u1' }, 'wrong-secret', { expiresIn: '1h' });
    req = { cookies: { [TOKEN_COOKIE]: token } };

    attachUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requireAuth', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    res = createMockRes();
    next = vi.fn();
  });

  it('returns 401, clears cookie, and does not call next when no user', () => {
    req = { user: null, cookies: { [TOKEN_COOKIE]: 'stale-token' } };

    requireAuth(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith(
      TOKEN_COOKIE,
      expect.objectContaining({ path: '/', httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when req.user is present', () => {
    req = { user: { userId: 'auth-user' }, cookies: {} };

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
