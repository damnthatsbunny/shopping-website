import { randomBytes } from 'node:crypto';

let developmentSecret;

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }

  if (!developmentSecret) {
    developmentSecret = randomBytes(32).toString('hex');
    console.warn('JWT_SECRET is unset; using a temporary development-only secret.');
  }

  return developmentSecret;
};