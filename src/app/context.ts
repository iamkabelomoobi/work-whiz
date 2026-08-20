import { GraphQLError } from 'graphql';
import { auth } from '@work-whiz/libs';
import { Role } from '@work-whiz/types/roles.type';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

export type SessionUser = {
  id: string;
  role?: Role;
  name?: string;
  email?: string;
  image?: string;
};

export type Session = {
  user: SessionUser;
  session: unknown;
};

const toHeaders = (headers: IncomingHttpHeaders): Headers => {
  const nextHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      nextHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      nextHeaders.set(key, value.join(', '));
    }
  }

  return nextHeaders;
};

export class Context {
  public readonly session: Session | null;
  public readonly headers: Headers;
  public readonly ipAddress: string | null;

  private constructor(
    session: Session | null,
    headers: Headers,
    ipAddress: string | null,
  ) {
    this.session = session;
    this.headers = headers;
    this.ipAddress = ipAddress;
  }

  get user(): SessionUser | null {
    return this.session?.user ?? null;
  }

  get role(): string | null {
    return this.user?.role ?? null;
  }

  get isAuthenticated(): boolean {
    return this.session !== null;
  }

  get isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  get isCandidate(): boolean {
    return this.role === Role.CANDIDATE;
  }

  get isEmployer(): boolean {
    return this.role === Role.EMPLOYER;
  }

  assertAuth(): SessionUser {
    const user = this.user;
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return user;
  }

  assertRole(allowedRoles: string[]): SessionUser {
    const user = this.assertAuth();

    if (!user.role || !allowedRoles.includes(user.role)) {
      throw new GraphQLError('Access denied: insufficient permissions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    return user;
  }

  assertAdmin(): SessionUser {
    return this.assertRole(['admin']);
  }

  assertCandidate(): SessionUser {
    return this.assertRole(['candidate']);
  }

  assertEmployer(): SessionUser {
    return this.assertRole(['employer']);
  }

  static internal(session: Session | null = null): Context {
    return new Context(session, new Headers(), null);
  }

  static async fromRequest(req: Request): Promise<Context> {
    const forwardedForHeader = req.headers['x-forwarded-for'];
    const forwardedFor =
      typeof forwardedForHeader === 'string'
        ? forwardedForHeader.split(',')[0]?.trim() || null
        : Array.isArray(forwardedForHeader)
          ? forwardedForHeader[0]?.trim() || null
          : null;
    const ipAddress = forwardedFor ?? req.ip ?? null;
    const headers = toHeaders(req.headers);
    const session = (await auth.api.getSession({ headers })) as Session | null;

    return new Context(session, headers, ipAddress);
  }
}

export const createContext = async ({
  req,
}: {
  req: Request;
}): Promise<Context> => Context.fromRequest(req);
