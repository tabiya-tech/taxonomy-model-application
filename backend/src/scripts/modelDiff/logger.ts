import chalk from "chalk";

export function createLogger(namespace: string) {
  return {
    log: (message: string) => {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} - ${namespace} - ${message}`);
    },

    info: (message: string) => {
      const timestamp = new Date().toISOString();
      console.info(chalk.blue(`${timestamp} - ${namespace} - INFO: ${message}`));
    },

    error: (message: string, error: Error) => {
      const timestamp = new Date().toISOString();

      console.error(chalk.red(`${timestamp} - ${namespace} - ERROR: ${message}`));

      console.error(error);
    },
    warn: (message: string) => {
      const timestamp = new Date().toISOString();
      console.warn(chalk.yellow(`${timestamp} - ${namespace} - WARN: ${message}`));
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
