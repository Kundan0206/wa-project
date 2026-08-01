import { Server } from 'socket.io';
import { supabase } from '../lib/supabase.js';

export function setupSocketIO(io: Server) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error('Invalid token'));
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, tenant_id, role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return next(new Error('User not found'));
      }

      socket.data.user = { id: userData.id, role: userData.role };
      socket.data.tenantId = userData.tenant_id;
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