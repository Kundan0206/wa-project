import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');

console.log('Looking for .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

console.log('After dotenv, SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('After dotenv, SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'set' : 'not set');

export const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  port: parseInt(process.env.PORT || '4000'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'whatsapp_webhook_verify'
};

console.log('Config loaded, SUPABASE_URL:', config.supabaseUrl ? 'set' : 'not set');