// Simple structured logger for production
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= (LEVELS[LOG_LEVEL as LogLevel] || 1);
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message} ${entry.meta ? JSON.stringify(entry.meta) : ""}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  console[level === "debug" ? "log" : level](formatLog(entry));
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};

export default logger;
