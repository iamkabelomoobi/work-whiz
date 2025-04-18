/**
 *
 *
 *
 */
import { JwtType, Role } from '@work-whiz/types';

/**
 * Interface representing a JWT token payload.
 */
interface IJwtToken {
  id: string;
  role: Role;
  type: JwtType;
}

interface IDecodedJwtToken {
  id: string;
  role: Role;
  type: JwtType;
}

export { IJwtToken, IDecodedJwtToken };
