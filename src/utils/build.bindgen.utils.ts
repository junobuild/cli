import {isNullish} from '@dfinity/utils';
import {execute} from '@junobuild/cli-tools';
import {magenta} from 'kleur';
import {checkToolInstalled} from './env.utils';
import {detectPackageManager} from './pm.utils';
import {confirmAndExit} from './prompt.utils';

export const checkIcpBindgen = async (): Promise<{valid: boolean}> => {
  const pm = detectPackageManager();

  const command = pm === 'npm' || isNullish(pm) ? 'npx' : pm;

  const {valid} = await checkToolInstalled({
    command,
    args: ['icp-bindgen', '--version', ...(command === 'npx' ? ['--no'] : [])]
  });

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `${magenta(
        '@icp-sdk/bindgen'
      )} is not available. This tool is required to generate API bindings. Would you like to install it now?`
    );

    await execute({
      command: pm ?? 'npm',
      args: [pm === 'npm' ? 'i' : 'add', '@icp-sdk/bindgen', '-D']
    });
  }

  return {valid: true};
};
