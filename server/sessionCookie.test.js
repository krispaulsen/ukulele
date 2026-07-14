import { describe, it, expect, afterEach } from 'vitest';
import {
  getSessionCookieOptions,
  getSessionCookieClearOptions,
} from './sessionCookie.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalRender = process.env.RENDER;
const originalCrossOrigin = process.env.CROSS_ORIGIN_COOKIES;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalRender === undefined) delete process.env.RENDER;
  else process.env.RENDER = originalRender;
  if (originalCrossOrigin === undefined) delete process.env.CROSS_ORIGIN_COOKIES;
  else process.env.CROSS_ORIGIN_COOKIES = originalCrossOrigin;
});

describe('getSessionCookieOptions', () => {
  it('uses SameSite=Lax and secure=false for local HTTP', () => {
    delete process.env.NODE_ENV;
    delete process.env.RENDER;
    delete process.env.CROSS_ORIGIN_COOKIES;

    const opts = getSessionCookieOptions({ secure: false, headers: {} });

    expect(opts).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('uses SameSite=Lax and secure=true when NODE_ENV=production (Vercel rewrite)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CROSS_ORIGIN_COOKIES;

    const opts = getSessionCookieOptions({ headers: {} });

    expect(opts).toMatchObject({
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('uses SameSite=Lax and secure=true on Render by default', () => {
    delete process.env.NODE_ENV;
    process.env.RENDER = 'true';
    delete process.env.CROSS_ORIGIN_COOKIES;

    const opts = getSessionCookieOptions({ headers: {} });

    expect(opts).toMatchObject({
      secure: true,
      sameSite: 'lax',
    });
  });

  it('uses SameSite=None when CROSS_ORIGIN_COOKIES=true', () => {
    process.env.NODE_ENV = 'production';
    process.env.CROSS_ORIGIN_COOKIES = 'true';

    const opts = getSessionCookieOptions({ headers: {} });

    expect(opts).toMatchObject({
      secure: true,
      sameSite: 'none',
    });
  });

  it('detects HTTPS via X-Forwarded-Proto', () => {
    delete process.env.NODE_ENV;
    delete process.env.RENDER;
    delete process.env.CROSS_ORIGIN_COOKIES;

    const opts = getSessionCookieOptions({
      headers: { 'x-forwarded-proto': 'https' },
    });

    expect(opts).toMatchObject({
      secure: true,
      sameSite: 'lax',
    });
  });
});

describe('getSessionCookieClearOptions', () => {
  it('matches set-cookie path/sameSite/secure without maxAge', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CROSS_ORIGIN_COOKIES;
    const clear = getSessionCookieClearOptions({});

    expect(clear).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});
