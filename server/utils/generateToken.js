import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '30d' });
};

export default generateToken;
