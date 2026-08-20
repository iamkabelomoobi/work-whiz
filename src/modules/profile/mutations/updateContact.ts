import type { Context } from '@work-whiz/app/context';
import { userService } from '@work-whiz/services';
import { emailValidator, phoneValidator } from '@work-whiz/validators';
import type { IUser } from '@work-whiz/interfaces';
import type { ContactInput } from '../graphql/inputs';

export const updateContact = async (
  input: Partial<ContactInput>,
  context: Context,
) => {
  const user = context.assertAuth();

  if (input.email) emailValidator(input.email);
  if (input.phone) phoneValidator(input.phone);

  await userService.updateContact(user.id, input as Partial<IUser>);
  return { message: 'Contact information updated successfully' };
};
