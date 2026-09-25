import winston from 'winston'
import path    from 'path'
import fs      from 'fs'

// ── Ensure logs directory exists ───────────────────────────
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

// ── Shared formats ─────────────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, requestId, stack }) => {
    const rid = requestId ? ` [${requestId}]` : ''
    return `${timestamp} ${level} [${service}]${rid} ${stack ?? message}`
  }),
)

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  // JSON lines — easy to grep and parse
  winston.format.json(),
)

// ── Root logger ────────────────────────────────────────────
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  defaultMeta: { service: 'core-service' },
  transports: [
    // Console — coloured, human-readable
    new winston.transports.Console({ format: consoleFormat }),

    // Combined log — every level
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format:   fileFormat,
      maxsize:  10 * 1024 * 1024,   // 10 MB per file
      maxFiles: 7,                   // keep 7 rotations
      tailable: true,
    }),

    // Error-only log
    new winston.transports.File({
      level:    'error',
      filename: path.join(logsDir, 'error.log'),
      format:   fileFormat,
      maxsize:  10 * 1024 * 1024,
      maxFiles: 7,
      tailable: true,
    }),
  ],
})

/**
 * Returns a child logger that automatically includes `requestId`
 * in every log line (both console and file transports).
 *
 * Usage:
 *   const log = childLogger(req)
 *   log.info('Worker profile fetched', { userId })
 */
export function childLogger(req: { requestId?: string }): winston.Logger {
  return logger.child({ requestId: req.requestId ?? 'no-request-id' })
}
