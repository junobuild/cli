import {existsSync} from 'node:fs';
import {join} from 'node:path';
import type {PackageManager} from '../types/pm';

export const detectPackageManager = (): PackageManager | undefined => {
  const pnpm = join(process.cwd(), 'pnpm-lock.yaml');

  if (existsSync(pnpm)) {
    return 'pnpm';
  }

  const yarn = join(process.cwd(), 'yarn.lock');

  if (existsSync(yarn)) {
    return 'yarn';
  }

  const npm = join(process.cwd(), 'package-lock.json');

  if (existsSync(npm)) {
    return 'npm';
  }

  return undefined;
};

export const pmInstallHint = (): string => {
  const pm = detectPackageManager();

  switch (pm) {
    case 'yarn':
      return 'yarn global add @junobuild/cli';
    case 'pnpm':
      return 'pnpm add -g @junobuild/cli';
    default:
      return 'npm i -g @junobuild/cli';
  }
};
