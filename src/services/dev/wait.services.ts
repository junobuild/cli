import {green, red} from 'kleur';
import ora from 'ora';
import {readEmulatorConfig} from '../../configs/emulator.config';
import type {CliEmulatorConfig} from '../../types/emulator';
import {dispatchRequest} from '../emulator/emulator.admin.services';

const TIMEOUT_IN_MILLISECONDS = 15000;
const RETRY_IN_MILLISECONDS = 500;

export const wait = async () => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const spinner = ora('Waiting for emulator...').start();

  let status: 'ready' | 'timeout' | undefined = undefined;

  try {
    status = await waitEmulatorReady({
      count: TIMEOUT_IN_MILLISECONDS / RETRY_IN_MILLISECONDS,
      config: parsedResult.config
    });
  } finally {
    spinner.stop();
  }

  if (status === 'timeout') {
    console.log(red('The emulator is not ready. Operation timed out.'));
    process.exit(1);
  }

  console.log(`Emulator is ${green('ready')}.`);
};

const waitEmulatorReady = async ({
  count,
  config
}: {
  count: number;
  config: CliEmulatorConfig;
}): Promise<'ready' | 'timeout'> => {
  const ready = await isEmulatorReady({config});

  if (ready) {
    return 'ready';
  }

  const nextCount = count - 1;

  if (nextCount === 0) {
    return 'timeout';
  }

  // eslint-disable-next-line promise/avoid-new
  await new Promise((resolve) => setTimeout(resolve, RETRY_IN_MILLISECONDS));

  return await waitEmulatorReady({count: nextCount, config});
};

// The emulator mounts its internal CLI/admin server as the final step of the startup flow.
// That's why we can use the health endpoint to check when the emulator is ready.
// It's also more convenient than pinging something like the satellite version,
// since initialization, agent creation, or fetching the version may hang until a timeout.
const isEmulatorReady = async ({config}: {config: CliEmulatorConfig}): Promise<boolean> => {
  try {
    const {result} = await dispatchRequest({
      config,
      request: 'health'
    });

    // At the moment, we only check whether the response succeeded.
    // We don’t verify if the response body is "Ok" or "Unknown command".
    // Since we don’t have specific use cases yet—other than checking if the server is mounted—
    // this keeps the command compatible with older versions of the Docker image that didn’t
    // expose the /health endpoint.
    return result === 'ok';
  } catch (_e: unknown) {
    return false;
  }
};
