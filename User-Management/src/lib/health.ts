import prisma from "./prisma";
import { promises as fs } from "fs";
import path from "path";

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  [key: string]: any;
}

export interface ServiceHealth {
  database: HealthCheckResult;
  memory: HealthCheckResult;
  disk: HealthCheckResult;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: string;
  environment: string;
  version: string;
  responseTime: string;
  services: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
  endpoints: {
    auth: string;
    users: string;
    profiles: string;
    friendships: string;
  };
}

/**
 * Check database connectivity and performance
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - start;
    
    // Get database statistics
    const [userCount, activeUsers, profileCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.profile.count()
    ]);

    // Get database size
    const dbSize = await getDatabaseSize();

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      connection: "active",
      stats: {
        totalUsers: userCount,
        activeUsers: activeUsers,
        totalProfiles: profileCount,
        dbSize: dbSize
      },
      performance: {
        queryTime: responseTime < 100 ? "good" : responseTime < 500 ? "fair" : "slow"
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
      connection: "failed",
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Get current memory usage information
 */
export function getMemoryUsage(): HealthCheckResult {
  try {
    const used = process.memoryUsage();
    const heapUsagePercent = Math.round((used.heapUsed / used.heapTotal) * 100);
    
    // Determine health status based on memory usage
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (heapUsagePercent > 90) {
      status = "unhealthy";
    } else if (heapUsagePercent > 75) {
      status = "degraded";
    }

    return {
      status,
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`,
      heapUsagePercent: `${heapUsagePercent}%`,
      warning: heapUsagePercent > 75 ? "High memory usage detected" : undefined
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unable to get memory info"
    };
  }
}

/**
 * Check disk usage and availability
 */
export async function getDiskUsage(): Promise<HealthCheckResult> {
  try {
    // Check if database file is accessible
    const dbPath = getDatabasePath();
    const dbStats = await fs.stat(dbPath);
    const dbSizeBytes = dbStats.size;
    const dbSizeMB = (dbSizeBytes / 1024 / 1024).toFixed(2);

    // Check disk space where database is located
    const dbDir = path.dirname(dbPath);
    
    return {
      status: "healthy",
      database: {
        path: dbPath,
        size: `${dbSizeMB}MB`,
        accessible: true,
        lastModified: dbStats.mtime.toISOString()
      },
      directory: {
        path: dbDir,
        accessible: true
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Disk check failed",
      accessible: false
    };
  }
}

/**
 * Get database file size
 */
async function getDatabaseSize(): Promise<string> {
  try {
    const dbPath = getDatabasePath();
    const stats = await fs.stat(dbPath);
    return `${(stats.size / 1024 / 1024).toFixed(2)}MB`;
  } catch {
    return "unknown";
  }
}

/**
 * Get database file path from environment
 */
function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:../DB/dev.db";
  return dbUrl.replace("file:.", "");
}

/**
 * Get API service health
 */
export function getApiHealth(): HealthCheckResult {
  return {
    status: "healthy",
    port: process.env.PORT || 3000,
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * Perform complete health check
 */
export async function performHealthCheck(): Promise<HealthCheckResponse> {
  const startTime = Date.now();
  
  try {
    const [dbHealth, memoryInfo, diskInfo] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(getMemoryUsage()),
      getDiskUsage()
    ]);

    const apiHealth = getApiHealth();
    const responseTime = Date.now() - startTime;

    const healthCheck: HealthCheckResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      responseTime: `${responseTime}ms`,
      services: {
        api: apiHealth,
        database: dbHealth,
        memory: memoryInfo,
        disk: diskInfo
      },
      endpoints: {
        auth: "/auth",
        users: "/users",
        profiles: "/profiles",
        friendships: "/friendships"
      }
    };

    // Determine overall health status
    const services = [dbHealth, memoryInfo, diskInfo];
    const hasUnhealthy = services.some(service => service.status === "unhealthy");
    const hasDegraded = services.some(service => service.status === "degraded");

    if (hasUnhealthy) {
      healthCheck.status = "error";
    } else if (hasDegraded) {
      healthCheck.status = "degraded";
    }

    return healthCheck;
    
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      responseTime: `${Date.now() - startTime}ms`,
      services: {
        api: { status: "unhealthy", error: "Health check failed" },
        database: { status: "unhealthy", error: "Database check failed" },
        memory: { status: "unhealthy", error: "Memory check failed" },
        disk: { status: "unhealthy", error: "Disk check failed" }
      },
      endpoints: {
        auth: "/auth",
        users: "/users", 
        profiles: "/profiles",
        friendships: "/friendships"
      }
    };
  }
}

/**
 * Simple readiness check (for Kubernetes readiness probe)
 */
export async function checkReadiness(): Promise<{ status: string; ready: boolean }> {
  try {
    const dbHealth = await checkDatabaseHealth();
    const ready = dbHealth.status === "healthy";
    
    return {
      status: ready ? "ready" : "not ready",
      ready
    };
  } catch {
    return {
      status: "not ready", 
      ready: false
    };
  }
}

/**
 * Simple liveness check (for Kubernetes liveness probe)
 */
export function checkLiveness(): { status: string; alive: boolean; uptime: number; timestamp: string } {
  return {
    status: "alive",
    alive: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}
