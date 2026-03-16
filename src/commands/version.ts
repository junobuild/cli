import {isEmptyString} from '@dfinity/utils';
import {green} from 'kleur';
import {version as cliCurrentVersion} from '../../package.json';
import {githubCliLastRelease, githubJunoDockerLastRelease} from '../rest/github.rest';
import {findEmulatorVersion} from '../services/emulator/version.services';
import {
  buildVersionFromGitHub,
  checkVersion,
  type CheckVersionResult
} from '../services/version/version.services';
import {pmInstallHint} from '../utils/pm.utils';

export const version = async () => {
  const check = await cliVersion();

  if (check.diff === 'error') {
    return;
  }

  await emulatorVersion();
};

const cliVersion = async (): Promise<CheckVersionResult> => {
  const result = await buildVersionFromGitHub({
    logReleaseOnError: () => 'CLI',
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
    commandLineHint: pmInstallHint()
  });
};

const emulatorVersion = async () => {
  const emulatorResult = await findEmulatorVersion();

  if (emulatorResult.status !== 'success') {
    return;
  }

  const {version: emulatorCurrentVersion} = emulatorResult;

  const result = await buildVersionFromGitHub({
    logReleaseOnError: () => 'Juno Docker',
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
