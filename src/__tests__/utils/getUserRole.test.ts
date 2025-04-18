import { getUserRole } from '@work-whiz/utils';
import { Request } from 'express';
import { Role } from '@work-whiz/types';

describe('getUserRole', () => {
  const createMockRequest = (host?: string): Partial<Request> => ({
    get: jest.fn().mockReturnValue(host),
  });

  describe('should correctly identify roles from host', () => {
    it('identifies ADMIN role from exact domain', () => {
      const req = createMockRequest('admin.example.com');
      expect(getUserRole(req as Request)).toBe(Role.ADMIN);
    });

    it('identifies ADMIN role from subdomain', () => {
      const req = createMockRequest('admin.dev.example.com');
      expect(getUserRole(req as Request)).toBe(Role.ADMIN);
    });

    it('identifies CANDIDATE role from exact domain', () => {
      const req = createMockRequest('www.example.com');
      expect(getUserRole(req as Request)).toBe(Role.CANDIDATE);
    });

    it('identifies EMPLOYER role from subdomain with port', () => {
      const req = createMockRequest('employer.localhost:3000');
      expect(getUserRole(req as Request)).toBe(Role.EMPLOYER);
    });
  });

  describe('should handle edge cases', () => {
    it('returns undefined for empty host', () => {
      const req = createMockRequest();
      expect(getUserRole(req as Request)).toBeUndefined();
    });

    it('returns undefined for null host', () => {
      const req = createMockRequest(null);
      expect(getUserRole(req as Request)).toBeUndefined();
    });

    it('returns undefined for unknown subdomain', () => {
      const req = createMockRequest('unknown.example.com');
      expect(getUserRole(req as Request)).toBeUndefined();
    });

    it('is case insensitive', () => {
      const req = createMockRequest('ADMIN.example.com');
      expect(getUserRole(req as Request)).toBe(Role.ADMIN);
    });
  });

  describe('security considerations', () => {
    it('does not match partial subdomains', () => {
      const req = createMockRequest('myadmin.example.com');
      expect(getUserRole(req as Request)).toBeUndefined();
    });

    it('does not match suffixes', () => {
      const req = createMockRequest('example.com/admin');
      expect(getUserRole(req as Request)).toBeUndefined();
    });
  });
});
