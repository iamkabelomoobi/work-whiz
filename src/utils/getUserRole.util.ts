import { Role } from '@work-whiz/types';
import { Request } from 'express';

interface RoleDomainConfig {
  subdomain: string;
  role: Role;
}

const ROLE_CONFIGS: RoleDomainConfig[] = [
  { subdomain: 'admin', role: Role.ADMIN },
  { subdomain: 'www', role: Role.CANDIDATE },
  { subdomain: 'employer', role: Role.EMPLOYER },
];

export const getUserRole = (req: Request): Role | undefined => {
  const host = req.get('host')?.toLowerCase();
  if (!host) return undefined;

  const matchingConfig = ROLE_CONFIGS.find(
    (config) =>
      host === `${config.subdomain}.example.com` ||
      host.startsWith(`${config.subdomain}.`)
  );

  return matchingConfig?.role;
};
