const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };

const timestamp = () => new Date().toISOString();

const log = (level, message) => {
  const line = `[${timestamp()}] [${levels[level]}] ${message}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

module.exports = {
  info: (msg) => log('info', msg),
  warn: (msg) => log('warn', msg),
  error: (msg) => log('error', msg),
  debug: (msg) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg);
  },
};
