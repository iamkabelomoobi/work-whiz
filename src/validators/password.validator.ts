/**
 *
 *
 *
 */
import { passwordSchema } from "./schemas/password.schema";

export const passwordValidator = (password: string) => {
  const { error } = passwordSchema.validate(password, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
