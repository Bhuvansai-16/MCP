import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  const db = new Pool({
    connectionString: process.env.POSTGRES_URL || 'postgresql://localhost:5432/mcp_playground',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🗄️  Setting up database...');

    // Create sessions table
    await db.query(`
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
    `);

    // Create protocol_metrics table
    await db.query(`
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
    `);

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
      CREATE INDEX IF NOT EXISTS idx_metrics_protocol ON protocol_metrics(protocol);
      CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON protocol_metrics(session_id);
    `);

    console.log('✅ Database setup completed successfully!');
    
    // Test data insertion
    console.log('📊 Inserting test data...');
    
    const testSessionId = 'test-session-' + Date.now();
    await db.query(`
      INSERT INTO sessions (id, prompt, document_content, protocols, results, metrics)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      testSessionId,
      'Test prompt for database setup',
      'Test document content for verification',
      ['raw', 'chain'],
      JSON.stringify([
        { protocol: 'raw', response: 'Test response', metrics: { tokens: 100, latency: 500, quality: 8.5 } },
        { protocol: 'chain', response: 'Test chain response', metrics: { tokens: 150, latency: 750, quality: 9.0 } }
      ]),
      JSON.stringify({ total_latency_ms: 1250 })
    ]);

    await db.query(`
      INSERT INTO protocol_metrics (session_id, protocol, tokens, latency_ms, quality_score, response_text)
      VALUES ($1, $2, $3, $4, $5, $6), ($1, $7, $8, $9, $10, $11)
    `, [
      testSessionId,
      'raw', 100, 500, 8.5, 'Test response',
      'chain', 150, 750, 9.0, 'Test chain response'
    ]);

    console.log('✅ Test data inserted successfully!');
    
    // Verify setup
    const sessionCount = await db.query('SELECT COUNT(*) FROM sessions');
    const metricsCount = await db.query('SELECT COUNT(*) FROM protocol_metrics');
    
    console.log(`📈 Database contains ${sessionCount.rows[0].count} sessions and ${metricsCount.rows[0].count} metrics`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await db.end();
  }
};

setupDatabase();