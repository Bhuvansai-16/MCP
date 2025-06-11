import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { protocolRunner } from '../services/protocolRunner.js';
import { db } from '../config/database.js';
import { mcpClient } from '../services/mcpClient.js';

const router = express.Router();

// Run protocols endpoint
router.post('/run',
  [
    body('prompt_text').isString().isLength({ min: 1, max: 10000 }),
    body('document_url').optional().isURL(),
    body('document_content').optional().isString().isLength({ max: 100000 }),
    body('protocols').isArray().custom((protocols) => {
      const validProtocols = ['raw', 'chain', 'tree', 'rag'];
      return protocols.every((p: string) => validProtocols.includes(p));
    }),
    body('config').optional().isObject()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { 
        prompt_text, 
        document_url, 
        document_content, 
        protocols, 
        config = {} 
      } = req.body;

      const sessionId = uuidv4();
      const startTime = Date.now();

      console.log(`Starting protocol run ${sessionId} with protocols:`, protocols);

      // Determine document content
      let documentText = document_content || '';
      if (document_url && !documentText) {
        try {
          // Use MCP fetch server to get document content
          await mcpClient.connectServer('fetch');
          const fetchResult = await mcpClient.callTool('fetch', 'fetch', {
            url: document_url
          });
          documentText = fetchResult.content[0]?.text || '';
        } catch (error) {
          console.warn('Failed to fetch document:', error);
          return res.status(400).json({
            error: 'Failed to fetch document from URL'
          });
        }
      }

      if (!documentText) {
        return res.status(400).json({
          error: 'Either document_content or document_url must be provided'
        });
      }

      const results = [];
      const protocolMetrics = [];

      // Run each protocol
      for (const protocol of protocols) {
        try {
          console.log(`Running ${protocol} protocol...`);
          
          const result = await protocolRunner.runProtocol(protocol, {
            prompt: prompt_text,
            document: documentText,
            documentUrl: document_url,
            config: config[protocol] || {}
          });

          results.push(result);
          protocolMetrics.push({
            protocol: result.protocol,
            tokens: result.metrics.tokens,
            latency_ms: result.metrics.latency,
            quality_score: result.metrics.quality,
            response_text: result.response
          });

          console.log(`${protocol} protocol completed in ${result.metrics.latency}ms`);
        } catch (error) {
          console.error(`Protocol ${protocol} failed:`, error);
          
          // Add error result
          results.push({
            protocol,
            response: `Error: ${error.message}`,
            metrics: {
              tokens: 0,
              latency: 0,
              quality: 0
            },
            error: true
          });
        }
      }

      const totalLatency = Date.now() - startTime;

      // Store session in database
      try {
        await db.query(
          `INSERT INTO sessions (id, prompt, document_url, document_content, protocols, results, metrics, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            sessionId,
            prompt_text,
            document_url,
            documentText.substring(0, 50000), // Limit stored content
            protocols,
            JSON.stringify(results),
            JSON.stringify({ total_latency_ms: totalLatency })
          ]
        );

        // Store individual protocol metrics
        for (const metric of protocolMetrics) {
          await db.query(
            `INSERT INTO protocol_metrics (session_id, protocol, tokens, latency_ms, quality_score, response_text)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              sessionId,
              metric.protocol,
              metric.tokens,
              metric.latency_ms,
              metric.quality_score,
              metric.response_text.substring(0, 10000) // Limit stored response
            ]
          );
        }

        console.log(`Session ${sessionId} stored successfully`);
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue with response even if storage fails
      }

      res.json({
        session_id: sessionId,
        results,
        total_latency_ms: totalLatency,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Protocol run error:', error);
      next(error);
    }
  }
);

// Get session results
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const session = result.rows[0];
    res.json({
      session_id: session.id,
      prompt: session.prompt,
      document_url: session.document_url,
      protocols: session.protocols,
      results: session.results,
      metrics: session.metrics,
      created_at: session.created_at
    });

  } catch (error) {
    next(error);
  }
});

// Get protocol information
router.get('/protocols/info', (req, res) => {
  res.json({
    available_protocols: [
      {
        name: 'raw',
        description: 'Single pass with full context for maximum information retention',
        parameters: [
          { name: 'max_tokens', type: 'number', default: 1000, description: 'Maximum tokens in response' },
          { name: 'temperature', type: 'number', default: 0.7, description: 'Creativity level (0-2)' }
        ],
        use_cases: ['Small documents', 'High accuracy requirements', 'Simple analysis']
      },
      {
        name: 'chain',
        description: 'Split into chunks, process sequentially with context flow',
        parameters: [
          { name: 'chunk_size', type: 'number', default: 1500, description: 'Size of each processing chunk' },
          { name: 'overlap', type: 'number', default: 200, description: 'Overlap between chunks' },
          { name: 'max_tokens', type: 'number', default: 500, description: 'Maximum tokens per chunk' }
        ],
        use_cases: ['Large documents', 'Sequential analysis', 'Detailed processing']
      },
      {
        name: 'tree',
        description: 'Branching parallel calls with aggregation for comprehensive analysis',
        parameters: [
          { name: 'branch_factor', type: 'number', default: 3, description: 'Number of parallel branches' },
          { name: 'max_depth', type: 'number', default: 2, description: 'Maximum tree depth' },
          { name: 'aggregation_method', type: 'string', default: 'synthesis', description: 'How to combine results' }
        ],
        use_cases: ['Multi-perspective analysis', 'Complex documents', 'Comprehensive coverage']
      },
      {
        name: 'rag',
        description: 'Embedding retrieval + summarization for focused responses',
        parameters: [
          { name: 'top_k', type: 'number', default: 5, description: 'Number of retrieved chunks' },
          { name: 'similarity_threshold', type: 'number', default: 0.7, description: 'Minimum similarity score' },
          { name: 'embedding_model', type: 'string', default: 'text-embedding-3-small', description: 'Embedding model to use' }
        ],
        use_cases: ['Large knowledge bases', 'Specific queries', 'Efficient processing']
      }
    ],
    mcp_servers: mcpClient.getServerStatus()
  });
});

// Get metrics summary
router.get('/metrics/summary', async (req, res, next) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    let timeCondition = '';
    switch (timeframe) {
      case '1h':
        timeCondition = "AND created_at > NOW() - INTERVAL '1 hour'";
        break;
      case '24h':
        timeCondition = "AND created_at > NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeCondition = "AND created_at > NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "AND created_at > NOW() - INTERVAL '30 days'";
        break;
    }

    const metricsQuery = `
      SELECT 
        protocol,
        COUNT(*) as runs,
        AVG(latency_ms) as avg_latency,
        AVG(tokens) as avg_tokens,
        AVG(quality_score) as avg_quality,
        MIN(latency_ms) as min_latency,
        MAX(latency_ms) as max_latency
      FROM protocol_metrics 
      WHERE 1=1 ${timeCondition}
      GROUP BY protocol
      ORDER BY protocol
    `;

    const totalQuery = `
      SELECT 
        COUNT(*) as total_runs,
        AVG(latency_ms) as overall_avg_latency,
        AVG(tokens) as overall_avg_tokens,
        AVG(quality_score) as overall_avg_quality
      FROM protocol_metrics 
      WHERE 1=1 ${timeCondition}
    `;

    const [metricsResult, totalResult] = await Promise.all([
      db.query(metricsQuery),
      db.query(totalQuery)
    ]);

    const protocolBreakdown: Record<string, any> = {};
    metricsResult.rows.forEach(row => {
      protocolBreakdown[row.protocol] = {
        runs: parseInt(row.runs),
        avg_latency: Math.round(parseFloat(row.avg_latency)),
        avg_tokens: Math.round(parseFloat(row.avg_tokens)),
        avg_quality: parseFloat(row.avg_quality).toFixed(2),
        min_latency: parseInt(row.min_latency),
        max_latency: parseInt(row.max_latency)
      };
    });

    const totals = totalResult.rows[0];

    res.json({
      timeframe,
      total_runs: parseInt(totals.total_runs) || 0,
      avg_latency: Math.round(parseFloat(totals.overall_avg_latency)) || 0,
      avg_tokens: Math.round(parseFloat(totals.overall_avg_tokens)) || 0,
      avg_quality: parseFloat(totals.overall_avg_quality).toFixed(2) || '0.00',
      protocol_breakdown: protocolBreakdown,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

// Get MCP server status
router.get('/mcp/status', (req, res) => {
  res.json({
    servers: mcpClient.getServerStatus(),
    timestamp: new Date().toISOString()
  });
});

// Connect to MCP server
router.post('/mcp/connect/:serverName', async (req, res, next) => {
  try {
    const { serverName } = req.params;
    const connected = await mcpClient.connectServer(serverName);
    
    res.json({
      server: serverName,
      connected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// List MCP server tools
router.get('/mcp/:serverName/tools', async (req, res, next) => {
  try {
    const { serverName } = req.params;
    const tools = await mcpClient.listTools(serverName);
    
    res.json({
      server: serverName,
      tools,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;