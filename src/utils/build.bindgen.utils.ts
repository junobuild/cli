import {isNullish} from '@dfinity/utils';
import {execute} from '@junobuild/cli-tools';
import {magenta} from 'kleur';
import {type PackageManager} from '../types/pm';
import {checkToolInstalled} from './env.utils';
import {detectPackageManager} from './pm.utils';
import {confirmAndExit} from './prompt.utils';

export const checkIcpBindgen = async (): Promise<{valid: boolean}> => {
  const pm = detectPackageManager();

  const {valid: localValid} = await checkLocalIcpBindgen({pm});

  if (localValid === true) {
    return {valid: true};
  }

  const {valid: globalValid} = await checkGlobalIcpBindgen();

  if (globalValid === true) {
    return {valid: true};
  }

  // Useful the day we require a specific version of the tool.
  if (localValid === false) {
    return {valid: localValid};
  }

  await confirmAndExit(
    `${magenta(
      '@icp-sdk/bindgen'
    )} is not available. This tool is required to generate API bindings. Would you like to install it now?`
  );

  await execute({
    command: pm ?? 'npm',
    args: [pm === 'npm' ? 'i' : 'add', '@icp-sdk/bindgen', '-D']
  });

  return {valid: true};
};

const checkLocalIcpBindgen = async ({
  pm
}: {
  pm: PackageManager | undefined;
}): Promise<{valid: boolean | 'error'}> => {
  const command = pm === 'npm' || isNullish(pm) ? 'npx' : pm;

  return await checkToolInstalled({
    command,
    args: ['icp-bindgen', '--version', ...(command === 'npx' ? ['--no'] : [])]
  });
};

const checkGlobalIcpBindgen = async (): Promise<{valid: boolean | 'error'}> => {
  return await checkToolInstalled({
    command: 'icp-bindgen',
    args: ['--version']
  });
};
