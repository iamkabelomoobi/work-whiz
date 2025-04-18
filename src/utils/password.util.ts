import * as argon2 from 'argon2';
import axios from 'axios';
import { config } from '@work-whiz/configs/config';

class PasswordUtil {
  private static instance: PasswordUtil;

  private constructor() {
    //
  }

  public static getInstance(): PasswordUtil {
    if (!PasswordUtil.instance) {
      PasswordUtil.instance = new PasswordUtil();
    }
    return PasswordUtil.instance;
  }

  public async hashSync(role: string, password: string): Promise<string> {
    try {
      const pepper = config?.authentication?.argon[role]?.pepper;
      if (!pepper) {
        throw new Error(`Missing secret (pepper).`);
      }
      const secret = Buffer.from(pepper);

      return await argon2.hash(password, { secret });
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message || error}`);
    }
  }

  public async compareSync(
    role: string,
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    try {
      const secret = Buffer.from(config?.authentication?.argon[role]?.pepper);
      if (!secret) {
        throw new Error(`Missing secret (pepper).`);
      }

      return await argon2.verify(hashed, plain, { secret });
    } catch (error) {
      throw new Error(`Password validation failed: ${error.message || error}`);
    }
  }

  public async checkLeakedPassword(
    role: string,
    password: string,
  ): Promise<boolean> {
    try {
      const hashed_password = await this.hashSync(role, password);

      const prefix = hashed_password.substring(0, 5);
      const suffix = hashed_password.substring(5);

      const response = await axios.get(
        `https://api.pwnedpasswords.com/range/${prefix}`,
      );

      const is_leaked = response.data
        .split('\n')
        .some((line: string) => line.startsWith(suffix));

      return is_leaked;
    } catch (error) {
      console.error('Error checking password:', error);
      return false;
    }
  }
}

export const passwordUtil = PasswordUtil.getInstance();
