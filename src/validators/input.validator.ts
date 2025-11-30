import crypto from 'crypto';

/**
 * Validates if two strings are equal using a timing-safe comparison.
 * Prevents timing attacks by ensuring comparison takes constant time.
 *
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {boolean} True if strings are equal, false otherwise
 */
export const validateInput = (str1: string, str2: string): boolean => {
  const trimmedStr1 = `${str1}`.trim();
  const trimmedStr2 = `${str2}`.trim();

  const buffer1: Buffer = Buffer.from(trimmedStr1, 'utf8');
  const buffer2: Buffer = Buffer.from(trimmedStr2, 'utf8');

  const uintBuffer1 = new Uint8Array(buffer1);
  const uintBuffer2 = new Uint8Array(buffer2);

  return (
    uintBuffer1.length === uintBuffer2.length &&
    crypto.timingSafeEqual(uintBuffer1, uintBuffer2)
  );
};
