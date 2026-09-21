export interface DatabaseStatus {
  provider: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | string;
  connected: boolean;
}

export interface UptimeInfo {
  seconds: number;
  formatted: string;
}

export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
}

export interface HealthData {
  service: string;
  status: string;
  timestamp: string;
  uptime: UptimeInfo;
  environment: string;
  database: DatabaseStatus;
  memoryUsage: MemoryUsage;
}

export interface HealthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: HealthData;
}
