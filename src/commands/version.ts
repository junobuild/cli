import {isNullish} from '@dfinity/utils';
import {red} from 'kleur';
import {clean} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {githubCliLastRelease} from '../rest/github.rest';
import {checkVersion} from '../services/version.services';

export const version = async () => {
  await cliVersion();
};

const cliVersion = async () => {
  const githubRelease = await githubCliLastRelease();

  if (githubRelease === undefined) {
    console.log(red('Cannot fetch last release version of Juno on GitHub 😢.'));
    return;
  }

  const {tag_name} = githubRelease;

  const latestVersion = clean(tag_name);

  if (isNullish(latestVersion)) {
    console.log(red(`Cannot extract version from release. Reach out Juno❗️`));
    return;
  }

  checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion,
    displayHint: 'CLI',
    commandLineHint: `npm i -g @junobuild/cli`
  });
};
