import type { Context } from '@work-whiz/app/context';
import { userService } from '@work-whiz/services';

export const deleteAccount = async (context: Context) => {
  const user = context.assertAuth();
  return userService.deleteAccount(user.id);
};
