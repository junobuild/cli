import {isEmptyString, isNullish} from '@dfinity/utils';
import {green, red} from 'kleur';
import {clean} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {
  githubCliLastRelease,
  githubJunoDockerLastRelease,
  type GithubLastReleaseResult
} from '../rest/github.rest';
import {findEmulatorVersion} from '../services/emulator/version.services';
import {checkVersion, type CheckVersionResult} from '../services/version.services';
import {detectPackageManager} from '../utils/pm.utils';

export const version = async () => {
  const check = await cliVersion();

  if (check.diff === 'error') {
    return;
  }

  await emulatorVersion();
};

const cliVersion = async (): Promise<CheckVersionResult> => {
  const result = await buildVersionFromGitHub({
    release: 'CLI',
    releaseFn: githubCliLastRelease
  });

  if (result.result === 'error') {
    return {diff: 'error'};
  }

  const {latestVersion} = result;

  return checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion,
    displayHint: 'CLI',
    commandLineHint: installHint()
  });
};

const installHint = (): string => {
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

const emulatorVersion = async () => {
  const emulatorResult = await findEmulatorVersion();

  if (emulatorResult.status !== 'success') {
    return;
  }

  const {version: emulatorCurrentVersion} = emulatorResult;

  const result = await buildVersionFromGitHub({
    release: 'Juno Docker',
    releaseFn: githubJunoDockerLastRelease
  });

  if (result.result === 'error') {
    return;
  }

  const {latestVersion} = result;

  // Images prior to v0.6.3 lacked proper metadata in org.opencontainers.image.version.
  // Earlier releases contained invalid values such as "0-arm64", while v0.6.2 returned an empty string.
  // Note: sanitizing the version read via docker/podman inspect causes these cases to resolve to null.
  if (isEmptyString(emulatorCurrentVersion)) {
    console.log(`Your Emulator is behind the latest version (${green(`v${latestVersion}`)}).`);
    return;
  }

  checkVersion({
    currentVersion: emulatorCurrentVersion,
    latestVersion,
    displayHint: 'Emulator'
  });
};

const buildVersionFromGitHub = async ({
  releaseFn,
  release
}: {
  releaseFn: () => Promise<GithubLastReleaseResult>;
  release: 'CLI' | 'Juno Docker';
}): Promise<{result: 'success'; latestVersion: string} | {result: 'error'}> => {
  const githubRelease = await releaseFn();

  if (githubRelease.status === 'error') {
    console.log(red(`Cannot fetch the last version of ${release} on GitHub 😢.`));
    return {result: 'error'};
  }

  const {
    release: {tag_name}
  } = githubRelease;

  const latestVersion = clean(tag_name);

  if (isNullish(latestVersion)) {
    console.log(red(`Cannot extract version from the ${release} release. Reach out Juno❗️`));
    return {result: 'error'};
  }

  return {result: 'success', latestVersion};
};
