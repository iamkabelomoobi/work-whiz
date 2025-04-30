import crypto from 'crypto';

export const validateInput = (str1: string, str2: string): boolean => {
  const trimmedStr1 = `${str1}`.trim();
  const trimmedStr2 = `${str2}`.trim();

  const buffer1: Buffer = Buffer.from(trimmedStr1, 'utf8');
  const buffer2: Buffer = Buffer.from(trimmedStr2, 'utf8');

  return (
    buffer1.length === buffer2.length &&
    crypto.timingSafeEqual(buffer1, buffer2)
  );
};
