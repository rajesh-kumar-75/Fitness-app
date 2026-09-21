import { getDatabaseStatus } from '../config/db.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

/**
 * Controller to handle application and database health checks.
 */
export const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = process.uptime();

  const healthData = {
    service: 'Fitness & Workout Management Platform API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
    environment: config.nodeEnv,
    database: {
      provider: 'MongoDB',
      status: dbStatus,
      connected: dbStatus === 'connected',
    },
    memoryUsage: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  };

  return ApiResponse.success(res, 'System health check completed successfully', healthData);
};

/**
 * Helper to format uptime into human-readable duration.
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}
