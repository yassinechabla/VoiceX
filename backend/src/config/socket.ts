import { Server as HTTPServer } from 'https';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const setupSocketIO = (server: HTTPServer | HttpServer): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || process.env.ADMIN_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string };
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      (socket as any).user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${(socket as any).user.username}`);

    // Join admin room
    socket.join('admin');

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${(socket as any).user.username}`);
    });
  });

  return io;
};


