import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { protocolRateLimiter } from '../middleware/rateLimiter.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { ProtocolRunner } from '../services/ProtocolRunner.js';
import { MetricsCollector } from '../services/MetricsCollector.js';

const router = express.Router();
const protocolRunner = new ProtocolRunner();
const metricsCollector = new MetricsCollector();

router.post('/run',
  protocolRateLimiter,
  [
    body('prompt').isString().isLength({ min: 1, max: 10000 }),
    body('document').isString().isLength({ min: 1, max: 100000 }),
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
        return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
      }

      const { prompt, document, protocols, config = {} } = req.body;
      const sessionId = uuidv4();

      logger.info('Starting protocol run', {
        sessionId,
        protocols,
        promptLength: prompt.length,
        documentLength: document.length
      });

      const startTime = Date.now();
      const results = [];

      for (const protocol of protocols) {
        try {
          const protocolStartTime = Date.now();
          const result = await protocolRunner.runProtocol(protocol, {
            prompt,
            document,
            config: config[protocol] || {}
          });

          const metrics = {
            tokens: result.tokens,
            latency_ms: Date.now() - protocolStartTime,
            quality_score: result.quality_score
          };

          results.push({
            protocol,
            response: result.response,
            metrics
          });

          // Collect metrics
          metricsCollector.recordProtocolRun(protocol, metrics);

        } catch (error) {
          logger.error(`Protocol ${protocol} failed`, { error: error.message, sessionId });
          results.push({
            protocol,
            response: `Error: ${error.message}`,
            metrics: {
              tokens: 0,
              latency_ms: Date.now() - startTime,
              quality_score: 0
            }
          });
        }
      }

      const totalLatency = Date.now() - startTime;
      logger.info('Protocol run completed', {
        sessionId,
        totalLatency,
        protocolsRun: protocols.length
      });

      res.json({
        session_id: sessionId,
        results,
        total_latency_ms: totalLatency
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get protocol information
router.get('/info', (req, res) => {
  res.json({
    available_protocols: [
      {
        name: 'raw',
        description: 'Single pass with full context',
        parameters: ['max_tokens', 'temperature']
      },
      {
        name: 'chain',
        description: 'Split into chunks, process sequentially',
        parameters: ['chunk_size', 'overlap', 'max_tokens']
      },
      {
        name: 'tree',
        description: 'Branching parallel calls with aggregation',
        parameters: ['branch_factor', 'max_depth', 'aggregation_method']
      },
      {
        name: 'rag',
        description: 'Embedding retrieval + summarization',
        parameters: ['top_k', 'similarity_threshold', 'embedding_model']
      }
    ]
  });
});

export default router;