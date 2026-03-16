import {isNullish} from '@dfinity/utils';
import {red} from 'kleur';
import {clean} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {
  githubCliLastRelease,
  githubJunoDockerLastRelease,
  GithubLastReleaseResult
} from '../rest/github.rest';
import {checkVersion, CheckVersionResult} from '../services/version.services';
import {detectPackageManager} from '../utils/pm.utils';
import {readEmulatorConfig} from '../configs/emulator.config';

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

const emulatorVersion = async (): Promise<CheckVersionResult> => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return {diff: "error"};
  }



  const result = await buildVersionFromGitHub({
    release: 'Juno Docker',
    releaseFn: githubJunoDockerLastRelease
  });

  if (result.result === 'error') {
    return {diff: 'error'};
  }

  const {latestVersion} = result;


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
