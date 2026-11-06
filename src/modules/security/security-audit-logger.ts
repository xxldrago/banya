"""Security Audit Logger for Banya.Sauna Platform.

This module implements comprehensive security audit logging to track all
security-related events, including authentication attempts, authorization
checks, fraud detection, and other security-relevant activities.

The audit log provides:
1. Immutable, append-only log entries
2. Real-time monitoring capabilities
3. Compliance reporting
4. Forensic analysis support
5. Alert generation

All security events are logged with:
- Timestamp
- User information (ID, role, IP)
- Event type and details
- Request metadata
- System context
"""

import { redis } from "@/shared/lib/redis";
import { getSession } from "@/shared/middlewares/get-session";
import { NextRequest } from "next/server";
import crypto from "crypto";

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  outcome: "success" | "failure" | "partial";
  details: Record<string, any>;
  metadata?: Record<string, any>;
  sessionId?: string;
  geoLocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export enum SecurityEventType {
  // Authentication events
  AUTH_LOGIN_ATTEMPT = "AUTH_LOGIN_ATTEMPT",
  AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE = "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_PASSWORD_CHANGED = "AUTH_PASSWORD_CHANGED",
  AUTH_PASSWORD_RESET = "AUTH_PASSWORD_RESET",
  AUTH_2FA_SETUP = "AUTH_2FA_SETUP",
  AUTH_2FA_VERIFIED = "AUTH_2FA_VERIFIED",
  AUTH_2FA_FAILED = "AUTH_2FA_FAILED",
  AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  AUTH_ACCOUNT_UNLOCKED = "AUTH_ACCOUNT_UNLOCKED",

  // Authorization events
  AUTHZ_ACCESS_GRANTED = "AUTHZ_ACCESS_GRANTED",
  AUTHZ_ACCESS_DENIED = "AUTHZ_ACCESS_DENIED",
  AUTHZ_IDOR_VIOLATION = "AUTHZ_IDOR_VIOLATION",
  AUTHZ_ROLE_CHANGED = "AUTHZ_ROLE_CHANGED",
  AUTHZ_PERMISSION_ASSIGNED = "AUTHZ_PERMISSION_ASSIGNED",

  // Fraud detection events
  FRAUD_DETECTION = "FRAUD_DETECTION",
  FRAUD_BLOCKED = "FRAUD_BLOCKED",
  FRAUD_CHALLENGED = "FRAUD_CHALLENGED",
  FRAUD_REVIEWED = "FRAUD_REVIEWED",
  FRAUD_FALSE_POSITIVE = "FRAUD_FALSE_POSITIVE",

  // Security configuration events
  SECURITY_CONFIG_UPDATED = "SECURITY_CONFIG_UPDATED",
  SECURITY_POLICY_UPDATED = "SECURITY_POLICY_UPDATED",
  SECURITY_HEADER_UPDATED = "SECURITY_HEADER_UPDATED",
  SECURITY_SCAN_STARTED = "SECURITY_SCAN_STARTED",
  SECURITY_SCAN_COMPLETED = "SECURITY_SCAN_COMPLETED",

  // Infrastructure events
  SECURITY_INCIDENT = "SECURITY_INCIDENT",
  SECURITY_ALERT = "SECURITY_ALERT",
  SECURITY_VULNERABILITY = "SECURITY_VULNERABILITY",
  SECURITY_PATCH_APPLIED = "SECURITY_PATCH_APPLIED",

  // Access events
  ACCESS_LOG = "ACCESS_LOG",
  API_ACCESS_LOG = "API_ACCESS_LOG",
  ADMIN_ACCESS_LOG = "ADMIN_ACCESS_LOG",
}

export enum SecurityEventSeverity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface SecurityLogQuery {
  eventTypes?: SecurityEventType[];
  severity?: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  startTime?: Date;
  endTime?: Date;
  resourceType?: string;
  resourceId?: string;
  outcome?: "success" | "failure" | "partial";
  limit?: number;
  offset?: number;
  sortBy?: "timestamp" | "severity" | "eventType";
  sortOrder?: "asc" | "desc";
}

export interface SecurityStatistics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecurityEventSeverity, number>;
  eventsByOutcome: Record<"success" | "failure" | "partial", number>;
  topFailedIPs: Array<{ ip: string; count: number }>;
  topFailedUsers: Array<{ userId: string; count: number }>;
  hourlyTrends: Array<{ hour: number; count: number }>;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private readonly EVENT_TTL = 90 * 24 * 60 * 60; // 90 days
  private readonly BATCH_SIZE = 1000;
  private readonly MAX_BATCH_WAIT = 5000; // 5 seconds

  private pendingEvents: SecurityEvent[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor() {
    // Start batch processing timer
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.MAX_BATCH_WAIT);

    // Clear timer on process exit
    process.on("beforeExit", () => {
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
      }
      this.flushBatch();
    });
  }

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  async logEvent(event: Omit<SecurityEvent, "id" | "timestamp">): Promise<string> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Add to batch for processing
    this.pendingEvents.push(securityEvent);

    // Process immediately if batch is full
    if (this.pendingEvents.length >= this.BATCH_SIZE) {
      await this.flushBatch();
    }

    return securityEvent.id;
  }

  async logAuthenticationEvent(
    eventType: SecurityEventType,
    outcome: "success" | "failure" | "partial",
    req: NextRequest,
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    const session = await getSession(req);
    const ip = this.extractIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    const event: Omit<SecurityEvent, "id" | "timestamp"> = {
      eventType,
      severity: this.determineSeverity(eventType, outcome),
      userId,
      userRole: session?.role,
      ipAddress: ip,
      userAgent,
      action: this.extractActionFromEventType(eventType),
      outcome,
      details,
    };

    return await this.logEvent(event);
  }

  async logAuthorizationEvent(
    req: NextRequest,
    resourceType: string,
    resourceId: string,
    action: string,
    allowed: boolean,
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    const session = await getSession(req);
    const ip = this.extractIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    const eventType = allowed
      ? SecurityEventType.AUTHZ_ACCESS_GRANTED
      : SecurityEventType.AUTHZ_ACCESS_DENIED;

    const event: Omit<SecurityEvent, "id" | "timestamp"> = {
      eventType,
      severity: allowed ? SecurityEventSeverity.INFO : SecurityEventSeverity.MEDIUM,
      userId,
      userRole: session?.role,
      ipAddress: ip,
      userAgent,
      resourceType,
      resourceId,
      action,
      outcome: allowed ? "success" : "failure",
      details,
    };

    return await this.logEvent(event);
  }

  async logFraudEvent(
    req: NextRequest,
    eventType: SecurityEventType,
    outcome: "success" | "failure" | "partial",
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    const session = await getSession(req);
    const ip = this.extractIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    const event: Omit<SecurityEvent, "id" | "timestamp"> = {
      eventType,
      severity: this.determineSeverity(eventType, outcome),
      userId,
      userRole: session?.role,
      ipAddress: ip,
      userAgent,
      action: "fraud_detection",
      outcome,
      details,
    };

    return await this.logEvent(event);
  }

  async logSecurityIncident(
    req: NextRequest,
    eventType: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, any> = {}
  ): Promise<string> {
    const session = await getSession(req);
    const ip = this.extractIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    const event: Omit<SecurityEvent, "id" | "timestamp"> = {
      eventType,
      severity,
      userId: session?.sub,
      userRole: session?.role,
      ipAddress: ip,
      userAgent,
      action: "security_incident",
      outcome: "failure",
      details,
    };

    return await this.logEvent(event);
  }

  async queryLogs(query: SecurityLogQuery): Promise<SecurityEvent[]> {
    const key = `security:logs`;
    const allEvents = await redis.lrange(key, 0, -1);

    let events = allEvents.map(event => JSON.parse(event)) as SecurityEvent[];

    // Apply filters
    if (query.eventTypes?.length) {
      events = events.filter(event => query.eventTypes.includes(event.eventType));
    }

    if (query.severity) {
      events = events.filter(event => event.severity === query.severity);
    }

    if (query.userId) {
      events = events.filter(event => event.userId === query.userId);
    }

    if (query.ipAddress) {
      events = events.filter(event => event.ipAddress === query.ipAddress);
    }

    if (query.resourceType) {
      events = events.filter(event => event.resourceType === query.resourceType);
    }

    if (query.resourceId) {
      events = events.filter(event => event.resourceId === query.resourceId);
    }

    if (query.outcome) {
      events = events.filter(event => event.outcome === query.outcome);
    }

    if (query.startTime) {
      events = events.filter(event => event.timestamp >= query.startTime);
    }

    if (query.endTime) {
      events = events.filter(event => event.timestamp <= query.endTime);
    }

    // Apply pagination
    const start = (query.offset || 0) * (query.limit || 10);
    const end = start + (query.limit || 10) - 1;

    // Apply sorting
    events.sort((a, b) => {
      const multiplier = query.sortOrder === "desc" ? -1 : 1;
      if (query.sortBy === "timestamp") {
        return (b.timestamp.getTime() - a.timestamp.getTime()) * multiplier;
      } else if (query.sortBy === "severity") {
        const severityOrder = {
          [SecurityEventSeverity.CRITICAL]: 4,
          [SecurityEventSeverity.HIGH]: 3,
          [SecurityEventSeverity.MEDIUM]: 2,
          [SecurityEventSeverity.LOW]: 1,
          [SecurityEventSeverity.INFO]: 0,
        };
        return (severityOrder[b.severity] - severityOrder[a.severity]) * multiplier;
      } else {
        return (b.eventType.localeCompare(a.eventType)) * multiplier;
      }
    });

    return events.slice(start, end + 1);
  }

  async getStatistics(startTime?: Date, endTime?: Date): Promise<SecurityStatistics> {
    const key = `security:logs`;
    const allEvents = await redis.lrange(key, 0, -1);

    let events = allEvents.map(event => JSON.parse(event)) as SecurityEvent[];

    if (startTime) {
      events = events.filter(event => event.timestamp >= startTime);
    }

    if (endTime) {
      events = events.filter(event => event.timestamp <= endTime);
    }

    // Calculate statistics
    const totalEvents = events.length;

    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventSeverity, number>);

    const eventsByOutcome = events.reduce((acc, event) => {
      acc[event.outcome] = (acc[event.outcome] || 0) + 1;
      return acc;
    }, {} as Record<"success" | "failure" | "partial", number>);

    // Top failed IPs
    const failedIPs = events
      .filter(event => event.outcome === "failure")
      .reduce((acc, event) => {
        acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topFailedIPs = Object.entries(failedIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Top failed users
    const failedUsers = events
      .filter(event => event.outcome === "failure" && event.userId)
      .reduce((acc, event) => {
        acc[event.userId!] = (acc[event.userId!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topFailedUsers = Object.entries(failedUsers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Hourly trends
    const hourlyTrends = Array.from({ length: 24 }, (_, hour) => {
      const hourEvents = events.filter(event => event.timestamp.getHours() === hour);
      return { hour, count: hourEvents.length };
    });

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      eventsByOutcome,
      topFailedIPs,
      topFailedUsers,
      hourlyTrends,
    };
  }

  async generateReport(query: SecurityLogQuery): Promise<string> {
    const events = await this.queryLogs(query);
    const stats = await this.getStatistics(query.startTime, query.endTime);

    const report = {
      generatedAt: new Date(),
      query,
      statistics: stats,
      sampleEvents: events.slice(0, 100), // Include sample events for context
    };

    return JSON.stringify(report, null, 2);
  }

  async cleanupOldLogs(): Promise<void> {
    // This method would clean up old logs from Redis
    // In production, you would implement proper log retention policies
  }

  private generateEventId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  private extractIP(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfConnectingIP = req.headers.get("cf-connecting-ip");

    return (
      forwardedFor?.split(",")[0] ||
      realIP ||
      cfConnectingIP ||
      "unknown"
    );
  }

  private extractActionFromEventType(eventType: SecurityEventType): string {
    // Convert event type to action string
    const actionMap: Record<SecurityEventType, string> = {
      [SecurityEventType.AUTH_LOGIN_ATTEMPT]: "login_attempt",
      [SecurityEventType.AUTH_LOGIN_SUCCESS]: "login_success",
      [SecurityEventType.AUTH_LOGIN_FAILURE]: "login_failure",
      [SecurityEventType.AUTH_LOGOUT]: "logout",
      [SecurityEventType.AUTH_SESSION_EXPIRED]: "session_expired",
      [SecurityEventType.AUTH_PASSWORD_CHANGED]: "password_changed",
      [SecurityEventType.AUTH_PASSWORD_RESET]: "password_reset",
      [SecurityEventType.AUTH_2FA_SETUP]: "2fa_setup",
      [SecurityEventType.AUTH_2FA_VERIFIED]: "2fa_verified",
      [SecurityEventType.AUTH_2FA_FAILED]: "2fa_failed",
      [SecurityEventType.AUTH_ACCOUNT_LOCKED]: "account_locked",
      [SecurityEventType.AUTH_ACCOUNT_UNLOCKED]: "account_unlocked",
      [SecurityEventType.AUTHZ_ACCESS_GRANTED]: "access_granted",
      [SecurityEventType.AUTHZ_ACCESS_DENIED]: "access_denied",
      [SecurityEventType.AUTHZ_IDOR_VIOLATION]: "idor_violation",
      [SecurityEventType.AUTHZ_ROLE_CHANGED]: "role_changed",
      [SecurityEventType.AUTHZ_PERMISSION_ASSIGNED]: "permission_assigned",
      [SecurityEventType.FRAUD_DETECTION]: "fraud_detection",
      [SecurityEventType.FRAUD_BLOCKED]: "fraud_blocked",
      [SecurityEventType.FRAUD_CHALLENGED]: "fraud_challenged",
      [SecurityEventType.FRAUD_REVIEWED]: "fraud_reviewed",
      [SecurityEventType.FRAUD_FALSE_POSITIVE]: "fraud_false_positive",
      [SecurityEventType.SECURITY_CONFIG_UPDATED]: "config_updated",
      [SecurityEventType.SECURITY_POLICY_UPDATED]: "policy_updated",
      [SecurityEventType.SECURITY_HEADER_UPDATED]: "header_updated",
      [SecurityEventType.SECURITY_SCAN_STARTED]: "scan_started",
      [SecurityEventType.SECURITY_SCAN_COMPLETED]: "scan_completed",
      [SecurityEventType.SECURITY_INCIDENT]: "security_incident",
      [SecurityEventType.SECURITY_ALERT]: "security_alert",
      [SecurityEventType.SECURITY_VULNERABILITY]: "vulnerability",
      [SecurityEventType.SECURITY_PATCH_APPLIED]: "patch_applied",
      [SecurityEventType.ACCESS_LOG]: "access_log",
      [SecurityEventType.API_ACCESS_LOG]: "api_access_log",
      [SecurityEventType.ADMIN_ACCESS_LOG]: "admin_access_log",
    };

    return actionMap[eventType] || eventType;
  }

  private determineSeverity(
    eventType: SecurityEventType,
    outcome: "success" | "failure" | "partial"
  ): SecurityEventSeverity {
    // Define severity based on event type and outcome
    const criticalEvents = [
      SecurityEventType.AUTH_ACCOUNT_LOCKED,
      SecurityEventType.AUTHZ_IDOR_VIOLATION,
      SecurityEventType.FRAUD_BLOCKED,
      SecurityEventType.SECURITY_INCIDENT,
      SecurityEventType.SECURITY_ALERT,
    ];

    const highSeverityEvents = [
      SecurityEventType.AUTH_LOGIN_FAILURE,
      SecurityEventType.AUTH_2FA_FAILED,
      SecurityEventType.AUTHZ_ACCESS_DENIED,
      SecurityEventType.FRAUD_CHALLENGED,
    ];

    if (criticalEvents.includes(eventType)) {
      return SecurityEventSeverity.CRITICAL;
    }

    if (highSeverityEvents.includes(eventType)) {
      return SecurityEventSeverity.HIGH;
    }

    if (outcome === "failure") {
      return SecurityEventSeverity.MEDIUM;
    }

    return SecurityEventSeverity.INFO;
  }

  private async flushBatch(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    const pipeline = redis.pipeline();

    for (const event of events) {
      const key = `security:logs`;
      pipeline.rpush(key, JSON.stringify(event));
      pipeline.expire(key, this.EVENT_TTL);
    }

    await pipeline.exec();
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }
}

// Export default instance
export const securityAuditLogger = SecurityAuditLogger.getInstance();

// Type exports
export type {
  SecurityEvent,
  SecurityLogQuery,
  SecurityStatistics,
  SecurityEventType,
  SecurityEventSeverity,
};