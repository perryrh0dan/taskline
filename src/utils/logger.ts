import { createLogger, transports, format } from 'winston';

const isDebug = process.env.DEBUG;

const scheme = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

const logger = createLogger({
  level: isDebug ? 'debug' : 'error',
  format: format.combine(format.timestamp(), scheme),
  transports: [new transports.Console()],
});

export default logger;
