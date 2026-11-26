import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getClientIp,
  isIpAllowed,
  signPresenceToken,
  verifyPresenceToken,
  checkPresence,
  issuePresenceToken,
} from './presence';
import { env } from '@/lib/env';

describe('Wi-Fi Presence Infrastructure', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SESSION_SECRET = '01234567890123456789012345678901';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getClientIp', () => {
    it('prioritizes X-PB-Client-IP header set by Nginx', () => {
      const headers = new Headers({
        'x-pb-client-ip': '181.44.55.66',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
        'x-real-ip': '3.3.3.3',
      });
      expect(getClientIp(headers)).toBe('181.44.55.66');
    });

    it('falls back to X-Forwarded-For if X-PB-Client-IP is absent', () => {
      const headers = new Headers({
        'x-forwarded-for': '181.44.55.77, 10.0.0.1',
      });
      expect(getClientIp(headers)).toBe('181.44.55.77');
    });

    it('falls back to X-Real-IP if others are absent', () => {
      const headers = new Headers({
        'x-real-ip': '181.44.55.88',
      });
      expect(getClientIp(headers)).toBe('181.44.55.88');
    });

    it('defaults to 127.0.0.1 if no IP headers are present', () => {
      const headers = new Headers({});
      expect(getClientIp(headers)).toBe('127.0.0.1');
    });
  });

  describe('isIpAllowed', () => {
    it('returns false for empty or whitespace allowed list', () => {
      expect(isIpAllowed('192.168.1.5', '')).toBe(false);
      expect(isIpAllowed('192.168.1.5', '   ')).toBe(false);
    });

    it('matches exact IPv4 address', () => {
      const allowed = '181.10.20.30, 200.50.60.70';
      expect(isIpAllowed('181.10.20.30', allowed)).toBe(true);
      expect(isIpAllowed('200.50.60.70', allowed)).toBe(true);
      expect(isIpAllowed('181.10.20.31', allowed)).toBe(false);
    });

    it('matches IPv4 CIDR range', () => {
      const allowed = '192.168.1.0/24, 10.0.0.0/8';
      expect(isIpAllowed('192.168.1.42', allowed)).toBe(true);
      expect(isIpAllowed('192.168.2.1', allowed)).toBe(false);
      expect(isIpAllowed('10.254.1.1', allowed)).toBe(true);
      expect(isIpAllowed('11.0.0.1', allowed)).toBe(false);
    });
  });

  describe('Tokens signing & verification', () => {
    const venueId = 'venue-uuid-123';

    it('signs and verifies a valid presence token', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = signPresenceToken({
        venueId,
        issuedAt: nowSec,
        expiresAt: nowSec + 90,
      });

      const payload = verifyPresenceToken(token, venueId);
      expect(payload).not.toBeNull();
      expect(payload?.venueId).toBe(venueId);
      expect(payload?.expiresAt).toBe(nowSec + 90);
    });

    it('rejects an expired token', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = signPresenceToken({
        venueId,
        issuedAt: nowSec - 200,
        expiresAt: nowSec - 10,
      });

      expect(verifyPresenceToken(token, venueId)).toBeNull();
    });

    it('rejects a tampered signature', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = signPresenceToken({
        venueId,
        issuedAt: nowSec,
        expiresAt: nowSec + 90,
      });

      const tampered = token.slice(0, -3) + 'xyz';
      expect(verifyPresenceToken(tampered, venueId)).toBeNull();
    });

    it('rejects a token if venueId does not match expected', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = signPresenceToken({
        venueId: 'another-venue',
        issuedAt: nowSec,
        expiresAt: nowSec + 90,
      });

      expect(verifyPresenceToken(token, venueId)).toBeNull();
    });
  });

  describe('issuePresenceToken helper', () => {
    it('creates token and cookie options', () => {
      const res = issuePresenceToken('venue-1', 60);
      expect(res.token).toContain('.');
      expect(res.cookieOptions.name).toBe('pb_venue_presence');
      expect(res.cookieOptions.maxAge).toBe(60);
      expect(res.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('checkPresence modes', () => {
    it('returns verified=true and required=false when mode=off', () => {
      env.VENUE_PRESENCE_MODE = 'off';
      const headers = new Headers({});
      const cookies = { get: () => undefined };

      const res = checkPresence(headers, cookies);
      expect(res.mode).toBe('off');
      expect(res.verified).toBe(true);
      expect(res.required).toBe(false);
    });

    it('returns required=false but reflects verification in mode=observe', () => {
      env.VENUE_PRESENCE_MODE = 'observe';
      env.VENUE_ALLOWED_PUBLIC_IPS = '181.1.1.1';
      const headers = new Headers({ 'x-pb-client-ip': '181.1.1.1' });
      const cookies = { get: () => undefined };

      const res = checkPresence(headers, cookies);
      expect(res.mode).toBe('observe');
      expect(res.verified).toBe(true);
      expect(res.required).toBe(false);
    });

    it('returns required=true and verified=false when unverified in mode=enforce', () => {
      env.VENUE_PRESENCE_MODE = 'enforce';
      env.VENUE_ALLOWED_PUBLIC_IPS = '181.1.1.1';
      const headers = new Headers({ 'x-pb-client-ip': '181.2.2.2' });
      const cookies = { get: () => undefined };

      const res = checkPresence(headers, cookies);
      expect(res.mode).toBe('enforce');
      expect(res.verified).toBe(false);
      expect(res.required).toBe(true);
      expect(res.reason).toContain('Conectate al Wi-Fi');
    });

    it('returns verified=true when valid cookie is present in mode=enforce', () => {
      env.VENUE_PRESENCE_MODE = 'enforce';
      const { token } = issuePresenceToken('venue-xyz', 90);
      const headers = new Headers({ 'x-pb-client-ip': '181.2.2.2' }); // IP changed
      const cookies = {
        get: (name: string) => (name === 'pb_venue_presence' ? { value: token } : undefined),
      };

      const res = checkPresence(headers, cookies, 'venue-xyz');
      expect(res.mode).toBe('enforce');
      expect(res.verified).toBe(true);
      expect(res.required).toBe(true);
    });
  });
});
