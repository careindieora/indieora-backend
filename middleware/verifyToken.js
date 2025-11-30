// middleware/verifyToken.js
import jwt from 'jsonwebtoken';

export default function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const token = parts[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in .env');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // attach user object to request (id, email, role expected from token)
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

  } catch (err) {
    console.error('verifyToken error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
