import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  defaultMeta: { service: 'chat-service' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service }) => {
      return `${timestamp} ${level} [${service}] ${message}`
    }),
  ),
  transports: [new winston.transports.Console()],
})
