import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const profileLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 150,
  message: 'Too many requests, please try again later.',
});

export const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many registration attempts, please try again later.',
});

export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  message: 'Too many login attempts, please wait and try again.',
});

export const logoutLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  message: 'Too many logout requests, please slow down.',
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});

export const resetPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many reset attempts. Please try again later.',
});

export const setupPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many setup attempts. Please wait and try again.',
});

export const createLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many creation requests. Please try again later.',
});
