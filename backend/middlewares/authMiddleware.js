import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Access denied. No token provided or invalid format." 
      });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. Token missing." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: "User not found. Token invalid." });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (err) {
    console.error("Authentication error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token." });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired." });
    }
    
    return res.status(500).json({ message: "Authentication failed." });
  }
};

// Optional authentication (for public routes that can work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      req.user = user;
    }
    
    next();
  } catch (err) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};