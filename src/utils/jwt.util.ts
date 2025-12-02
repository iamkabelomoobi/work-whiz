import * as jwt from 'jsonwebtoken';

import { config } from '@work-whiz/configs/config';
import { IJwtToken, IDecodedJwtToken } from '@work-whiz/interfaces';
import { JwtType } from '@work-whiz/types';

const signAsync = (
  payload: string | object | Buffer,
  secretOrPrivateKey: jwt.Secret,
  options?: jwt.SignOptions,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secretOrPrivateKey, options || {}, (err, token) => {
      if (err || !token) {
        return reject(err || new Error('Token generation failed'));
      }
      resolve(token);
    });
  });
};

const verifyAsync = <T>(
  token: string,
  secretOrPublicKey: jwt.Secret,
  options?: jwt.VerifyOptions,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, options || {}, (err, decoded) => {
      if (err || !decoded) {
        return reject(err || new Error('Token verification failed'));
      }
      resolve(decoded as T);
    });
  });
};

export default class JwtUtil {
  private static instance: JwtUtil;
  private readonly expirationTimes: Record<JwtType, number>;

  private constructor() {
    this.expirationTimes = {
      account_verification: 10 * 60, // 10 minutes in seconds
      access: 15 * 60, // 15 minutes in seconds
      refresh: 7 * 24 * 60 * 60, // 7 days in seconds
      password_setup: 30 * 60, // 15 minutes in seconds
      password_reset: 30 * 60, // 15 minutes in seconds
    };
  }

  public static getInstance(): JwtUtil {
    if (!JwtUtil.instance) {
      JwtUtil.instance = new JwtUtil();
    }
    return JwtUtil.instance;
  }

  private getJwtKey(role: string, secretKeyType: JwtType): string {
    const jwtKey = config?.authentication?.jwt?.[role]?.[secretKeyType];
    if (!jwtKey) {
      throw new Error(
        `JWT secret key not found for role: ${role}, type: ${secretKeyType}`,
      );
    }
    return jwtKey;
  }

  private getTokenExpiration(jwtType: JwtType): number {
    return this.expirationTimes[jwtType] ?? 0;
  }

  public async generate(payload: IJwtToken): Promise<string> {
    const jwtKey = this.getJwtKey(payload.role, payload.type);
    const expiresIn = this.getTokenExpiration(payload.type);

    if (!expiresIn) {
      throw new Error(`Invalid JWT token type: ${payload.type}`);
    }

    return signAsync(payload, jwtKey, { expiresIn });
  }

  public async verify(payload: {
    role: string;
    token: string;
    type: JwtType;
  }): Promise<IDecodedJwtToken> {
    const jwtKey = this.getJwtKey(payload.role, payload.type);
    return verifyAsync<IDecodedJwtToken>(payload.token, jwtKey);
  }

  public decode(token: string): IDecodedJwtToken | null {
    return jwt.decode(token) as IDecodedJwtToken | null;
  }
}

export const jwtUtil = JwtUtil.getInstance();
