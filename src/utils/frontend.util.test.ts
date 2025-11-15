import { createFrontendUrl } from './frontend.util';
import { Role } from '@work-whiz/types';

// Mock the config module
jest.mock('@work-whiz/configs/config', () => ({
  config: {
    frontend: {
      admin: 'https://admin.example.com',
      candidate: 'https://candidate.example.com',
      employer: 'https://employer.example.com',
    },
  },
}));

describe('createFrontendUrl', () => {
  it('returns admin frontend url', () => {
    expect(createFrontendUrl(Role.ADMIN)).toBe('https://admin.example.com');
  });

  it('returns candidate frontend url', () => {
    expect(createFrontendUrl('candidate' as Role)).toBe(
      'https://candidate.example.com',
    );
  });

  it('returns employer frontend url', () => {
    expect(createFrontendUrl('employer' as Role)).toBe(
      'https://employer.example.com',
    );
  });

  it('is case-insensitive', () => {
    expect(createFrontendUrl('Admin' as Role)).toBe(
      'https://admin.example.com',
    );
    expect(createFrontendUrl('CANDIDATE' as Role)).toBe(
      'https://candidate.example.com',
    );
    expect(createFrontendUrl('EmPlOyEr' as Role)).toBe(
      'https://employer.example.com',
    );
  });

  it('throws on invalid role', () => {
    expect(() => createFrontendUrl('invalid' as any)).toThrow(
      'Invalid user role: invalid',
    );
  });
});
