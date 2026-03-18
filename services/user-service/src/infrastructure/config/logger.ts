import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  defaultMeta: { service: 'user-service' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service, stack }) => {
      return `${timestamp} ${level} [${service}] ${stack ?? message}`
    })
  ),
  transports: [new winston.transports.Console()],
})
