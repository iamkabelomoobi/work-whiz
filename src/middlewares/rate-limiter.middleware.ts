import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const profileLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 150,
  message: 'Too many requests, please try again later.',
});

const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many registration attempts, please try again later.',
});

const verifyAccountLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 2,
  message: 'Too many verification attempts, please try again later.',
});

const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  message: 'Too many login attempts, please wait and try again.',
});

const logoutLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  message: 'Too many logout requests, please slow down.',
});

const forgotPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});

const resetPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many reset attempts. Please try again later.',
});

const createLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: 'Too many creation requests. Please try again later.',
});

export {
  profileLimiter,
  registerLimiter,
  verifyAccountLimiter,
  loginLimiter,
  logoutLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  createLimiter,
};
