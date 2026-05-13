import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export function setupSocketIO(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = decoded;
      socket.data.tenantId = decoded.tenantId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const tenantId = socket.data.tenantId;
    const userId = socket.data.user.id;

    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`tenant:${tenantId}:conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`tenant:${tenantId}:conversation:${conversationId}`);
    });

    socket.on('typing', (conversationId: string) => {
      socket.to(`tenant:${tenantId}:conversation:${conversationId}`).emit('agent_typing', {
        conversationId,
        userId
      });
    });

    socket.on('stop_typing', (conversationId: string) => {
      socket.to(`tenant:${tenantId}:conversation:${conversationId}`).emit('agent_stop_typing', {
        conversationId,
        userId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });
}