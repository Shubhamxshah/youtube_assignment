import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface DecodedToken {
  email: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.Authentication;
  const JWT_SECRET = process.env.JWT_SECRET as string;
  if (!token) {
    res.status(401).json("unauthorized");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    (req as any).email = decoded.email;
    next();
  } catch {
    res.status(403).json({error: 'Invalid or expired token'})
  }
}
