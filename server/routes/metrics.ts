import express from 'express';
import { MetricsCollector } from '../services/MetricsCollector.js';

const router = express.Router();
const metricsCollector = new MetricsCollector();

router.get('/summary', (req, res) => {
  const summary = metricsCollector.getSummary();
  res.json(summary);
});

router.get('/protocols/:protocol', (req, res) => {
  const { protocol } = req.params;
  const metrics = metricsCollector.getProtocolMetrics(protocol);
  res.json(metrics);
});

export default router;