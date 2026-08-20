import type { Context, SessionUser } from '@work-whiz/app/context';

export const getMe = (context: Context): SessionUser => context.assertAuth();
