import {type PackageJson, readPackageJson as readPackageJsonUtils} from '@junobuild/cli-tools';
import {PACKAGE_JSON_PATH} from '../constants/dev.constants';

export const readPackageJson = async (): Promise<PackageJson> =>
  await readPackageJsonUtils({packageJsonPath: PACKAGE_JSON_PATH});
