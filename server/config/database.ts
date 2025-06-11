import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection
export const db = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://localhost:5432/mcp_playground',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Redis connection
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.log('Redis Client Error', err));

// Initialize connections
export const initializeDatabase = async () => {
  try {
    await redis.connect();
    console.log('✅ Redis connected');
    
    // Test PostgreSQL connection
    await db.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    
    // Create tables if they don't exist
    await createTables();
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

const createTables = async () => {
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prompt TEXT NOT NULL,
      document_url TEXT,
      document_content TEXT,
      protocols TEXT[] NOT NULL,
      results JSONB NOT NULL,
      metrics JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createMetricsTable = `
    CREATE TABLE IF NOT EXISTS protocol_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      protocol VARCHAR(50) NOT NULL,
      tokens INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      quality_score DECIMAL(3,2) NOT NULL,
      response_text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_metrics_protocol ON protocol_metrics(protocol);
    CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON protocol_metrics(session_id);
  `;

  await db.query(createSessionsTable);
  await db.query(createMetricsTable);
  await db.query(createIndexes);
};