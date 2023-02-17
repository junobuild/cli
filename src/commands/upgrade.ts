import {SatelliteParameters, satelliteVersion, upgradeSatellite} from '@junobuild/admin';
import {red} from 'kleur';
import prompts from 'prompts';
import {coerce, compare} from 'semver';
import {SATELLITE_WASM_NAME} from '../constants/constants';
import {hasArgs, nextArg} from '../utils/args.utils';
import {GitHubAsset, GitHubRelease, githubReleases} from '../utils/github.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {upgradeWasmGitHub, upgradeWasmLocal} from '../utils/wasm.utils';

const promptReleases = async (
  githubReleases: GitHubRelease[]
): Promise<GitHubAsset | undefined> => {
  const choices = githubReleases.reduce((acc, {tag_name, assets}: GitHubRelease) => {
    const asset = assets?.find(({name}) => name.includes(SATELLITE_WASM_NAME));
    const title = `Juno ${tag_name} (${asset?.name ?? ''})`;

    return [...acc, ...(asset !== undefined ? [{title, value: asset}] : [])];
  }, [] as {title: string; value: GitHubAsset}[]);

  const {asset} = await prompts({
    type: 'select',
    name: 'asset',
    message: 'Which release should be used to upgrade your satellite?',
    choices,
    initial: 0
  });

  // In case of control+c
  if (asset === undefined) {
    process.exit(1);
  }

  return asset;
};

export const upgrade = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    console.log(`${red('No configuration found.')}`);
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const satellite = satelliteParameters(satelliteId);

  if (hasArgs({args, options: ['-s', '--src']})) {
    await upgradeCustom({satellite, args});
    return;
  }

  await upgradeRelease(satellite);
};

const upgradeRelease = async (satellite: SatelliteParameters) => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const releases = await githubReleases();

  if (releases === undefined) {
    console.log(`${red('Cannot fetch GitHub repo releases 😢.')}`);
    return;
  }

  const releasesWithAssets = releases.filter(
    ({assets}) => assets?.find(({name}) => name.includes(SATELLITE_WASM_NAME)) !== undefined
  );

  if (releasesWithAssets.length === 0) {
    console.log(`${red('No assets has been released. Reach out Juno❗')}`);
    return;
  }

  const newerReleases = releasesWithAssets.filter(({assets}) => {
    const asset = assets?.find(({name}) => name.includes(SATELLITE_WASM_NAME));

    if (asset === undefined) {
      return false;
    }

    const version = coerce(asset.name)?.format();

    if (version === undefined) {
      return false;
    }

    return compare(currentVersion, version) === -1;
  });

  if (newerReleases.length === 0) {
    console.log(`No newer releases are available at the moment.`);
    return;
  }

  const asset = await promptReleases(newerReleases);

  if (asset === undefined) {
    console.log(`${red('No asset has been released for the selected version. Reach out Juno❗️')}`);
    return;
  }

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeSatellite({
      satellite,
      wasm_module
    });

  await upgradeWasmGitHub({asset, upgrade: upgradeSatelliteWasm});
};

const upgradeCustom = async ({
  satellite,
  args
}: {
  satellite: SatelliteParameters;
  args?: string[];
}) => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return;
  }

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeSatellite({
      satellite,
      wasm_module
    });

  await upgradeWasmLocal({src, upgrade: upgradeSatelliteWasm});
};
