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

  const bun = join(process.cwd(), 'bun.lockb');

  if (existsSync(bun)) {
    return 'bun';
  }

  const npm = join(process.cwd(), 'package-lock.json');

  if (existsSync(npm)) {
    return 'npm';
  }

  return undefined;
};
