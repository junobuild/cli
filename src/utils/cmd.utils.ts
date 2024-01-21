import {
  ChildProcess,
  spawn as spawnCommand,
  type ChildProcessWithoutNullStreams
} from 'child_process';

export const spawn = async ({
  command,
  args,
  stdout
}: {
  command: string;
  args?: readonly string[];
  stdout?: (output: string) => void;
}): Promise<number | null> => {
  return await new Promise<number | null>((resolve, reject) => {
    const process: ChildProcessWithoutNullStreams = spawnCommand(command, args);

    process.stdout.on('data', (data) => {
      if (stdout !== null && stdout !== undefined) {
        stdout(`${data}`);
        return;
      }

      console.log(`${data}`);
    });
    process.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    process.on('close', (code) => {
      resolve(code);
    });
    process.on('error', (err) => {
      reject(err);
    });
  });
};

export const execute = async ({
  command,
  args
}: {
  command: string;
  args?: readonly string[];
}): Promise<number | null> => {
  return await new Promise<number | null>((resolve, reject) => {
    const process: ChildProcess = spawnCommand(command, args ?? [], {
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      resolve(code);
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
};
