import {isEmptyString, isNullish, notEmptyString} from '@dfinity/utils';
import type {JunoPackage} from '@junobuild/config';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {
  JUNO_PACKAGE_JSON_PATH,
  PACKAGE_JSON_PATH,
  SATELLITE_PROJECT_NAME
} from '../../../constants/dev.constants';
import {BuildMetadata, BuildType} from '../../../types/build';
import {readPackageJson} from '../../../utils/pkg.utils';

export const prepareJunoPkgForSatellite = async ({buildType}: {buildType: BuildType}) => {
  // We do not write a juno.package.json for legacy build
  if (buildType.build === 'legacy') {
    return;
  }

  const {version, satelliteVersion} = buildType;

  const pkg: JunoPackage = {
    version,
    name: SATELLITE_PROJECT_NAME,
    dependencies: {
      '@junobuild/satellite': satelliteVersion
    }
  };

  await writeFile(JUNO_PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2), 'utf-8');
};

export const prepareJunoPkgForSputnik = async ({
  buildType
}: {
  buildType: BuildType;
}): Promise<{success: 'ok' | 'skip'} | {error: string}> => {
  // We do not write a juno.package.json for legacy build
  if (buildType.build === 'legacy') {
    return {success: 'skip'};
  }

  const metadata = await prepareJavaScriptDevMetadata();

  if ('error' in metadata) {
    return {error: metadata.error};
  }

  const {satelliteVersion, sputnikVersion} = buildType;

  if (isNullish(sputnikVersion) || isEmptyString(sputnikVersion)) {
    return {error: `⚠️  Cannot resolve the Sputnik "version" in Cargo metadata. Aborting build!`};
  }

  const pkg: JunoPackage = {
    ...metadata,
    dependencies: {
      '@junobuild/satellite': satelliteVersion,
      '@junobuild/sputnik': sputnikVersion
    }
  };

  await writeFile(JUNO_PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2), 'utf-8');

  return {success: 'ok'};
};

export const prepareJavaScriptDevMetadata = async (): Promise<JunoPackage | {error: string}> => {
  const metadata = await prepareJavaScriptBuildMetadata();

  const pkgName = metadata?.juno?.functions?.name ?? metadata?.name;
  const pkgVersion = metadata?.juno?.functions?.version ?? metadata?.version;

  if (isNullish(pkgName) || isEmptyString(pkgName)) {
    return {error: `⚠️  Missing "name" in package metadata. Aborting build!`};
  }

  if (isNullish(pkgVersion) || isEmptyString(pkgVersion)) {
    return {error: `⚠️  Missing "version" in package metadata. Aborting build!`};
  }

  return {
    name: pkgName,
    version: pkgVersion
  };
};

export const prepareJavaScriptBuildMetadata = async (): Promise<BuildMetadata> => {
  if (!existsSync(PACKAGE_JSON_PATH)) {
    // No package.json therefore no metadata to pass to the build in the container.
    return undefined;
  }

  try {
    const {juno, version, name} = await readPackageJson();

    if (isEmptyString(juno?.functions?.version) && isEmptyString(version)) {
      // No version detected therefore no metadata to the build in the container.
      return undefined;
    }

    const functionsVersion = juno?.functions?.version;

    return {
      ...(notEmptyString(name) && {name}),
      ...(notEmptyString(version) && {version}),
      ...(notEmptyString(functionsVersion) && {juno})
    };
  } catch (err: unknown) {
    console.log(red('⚠️ Could not read build metadata from package.json.'));
    throw err;
  }
};
