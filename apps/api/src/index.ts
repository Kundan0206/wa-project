import './config.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';
import { supabase } from './lib/supabase.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { camelCaseResponses } from './middleware/camelCase.js';
import { setupSocketIO } from './services/socket.service.js';
import { connectQueues } from './queue/index.js';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = Buffer.from(buf);
  }
}));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

app.use((req, res, next) => {
  (req as any).supabase = supabase;
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', camelCaseResponses, routes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('Database connected');

    await connectQueues();
    console.log('Queues connected');

    setupSocketIO(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { supabase };