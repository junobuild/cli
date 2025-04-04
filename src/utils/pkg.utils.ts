import {readFile} from 'node:fs/promises';
import {PACKAGE_JSON_PATH} from '../constants/dev.constants';
import type {PackageJson} from '../types/pkg';

export const readPackageJson = async (): Promise<PackageJson> => {
  const packageJson = await readFile(PACKAGE_JSON_PATH, 'utf-8');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const {dependencies, version, juno} = JSON.parse(packageJson) as PackageJson;

  return {
    dependencies,
    version,
    juno
  };
};
