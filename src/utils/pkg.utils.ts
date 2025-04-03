import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

export interface PackageJson {
  dependencies?: Record<string, string>;
}

export const readPackageJson = async (): Promise<PackageJson> => {
  const packageJson = await readFile(join(process.cwd(), 'package.json'), 'utf-8');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const {dependencies} = JSON.parse(packageJson) as {dependencies?: Record<string, string>};

  return {
    dependencies
  };
};
