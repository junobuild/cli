import {execute} from '@junobuild/cli-tools';
import {magenta} from 'kleur';
import {detectPackageManager} from './pm.utils';
import {confirmAndExit} from './prompt.utils';

export const installEsbuild = async () => {
  const esbuildInstalled = await hasEsbuild();

  if (esbuildInstalled) {
    return;
  }

  await confirmAndExit(`${magenta('esbuild')} is required for building. Install it now?`);

  const pm = detectPackageManager();

  await execute({
    command: pm ?? 'npm',
    args: [pm === 'npm' ? 'i' : 'add', 'esbuild', '-D']
  });
};

const hasEsbuild = async (): Promise<boolean> => {
  try {
    await import('esbuild');
    return true;
  } catch (_err: unknown) {
    return false;
  }
};
