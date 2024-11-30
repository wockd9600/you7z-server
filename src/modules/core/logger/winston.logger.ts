// import * as winston from 'winston';

// export const logger = winston.createLogger({
//   transports: [
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         winston.format.printf(({ level, message, context, timestamp }) => {
//           return `[NEST] ${process.pid}  - ${timestamp}   ${level.toUpperCase()} [${
//             context || 'Application'
//           }] ${message}`;
//         }),
//       ),
//     }),
//   ],
// });

import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = winston.format;

const logDir = 'logs'; // logs 디렉토리 하위에 로그 파일 저장

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};
winston.addColors(colors);

const logFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  printf(({ level, message, context, timestamp, trace }) => {
    if (trace) {
      return `[NEST] ${process.pid}  - ${timestamp}   ${level.toUpperCase()} [${context || 'Application'}] ${message} \n Error Stack: ${trace}`;
    }
    return `[NEST] ${process.pid}  - ${timestamp}   ${level.toUpperCase()} [${context || 'Application'}] ${message}`;
  }),
);

const consoleOpts = {
  handleExceptions: true,
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  ),
};

const transports = [
  new winston.transports.Console(consoleOpts),

  // info 레벨 로그를 저장할 파일 설정
  new winstonDaily({
    level: 'info',
    datePattern: 'YYYY-MM-DD',
    dirname: logDir,
    filename: `%DATE%.log`, // file 이름 날짜로 저장
    maxSize: '20m',
    maxFiles: 30, // 30일치 로그 파일 저장
    zippedArchive: true,
  }),
  // // warn 레벨 로그를 저장할 파일 설정
  // new winstonDaily({
  //   level: 'warn',
  //   datePattern: 'YYYY-MM-DD',
  //   dirname: logDir + '/warn',
  //   filename: `%DATE%.warn.log`, // file 이름 날짜로 저장
  //   maxSize: '20m',
  //   maxFiles: 30, // 30일치 로그 파일 저장
  //   zippedArchive: true,
  // }),
  // // error 레벨 로그를 저장할 파일 설정
  new winstonDaily({
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + '/error', // error.log 파일은 /logs/error 하위에 저장
    filename: `%DATE%.error.log`,
    maxSize: '20m',
    maxFiles: 30,
    zippedArchive: true,
    format: winston.format.json(),
  }),
];

// logger.stream = {
//     // morgan wiston 설정
//     write: (message: string) => {
//         logger.info(message);
//     },
// };

// Production 환경이 아닌 경우(dev 등) 배포 환경에서는
// 최대한 자원을 안잡아 먹는 로그를 출력해야함
// if (process.env.NODE_ENV !== "production") {
const logger = winston.createLogger({
  levels,
  format: logFormat,
  transports,
});

export { logger };
