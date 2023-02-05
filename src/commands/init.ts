import {cyan, red} from 'kleur';
import prompts from 'prompts';
import {AuthSatelliteConfig, getAuthSatellites, getToken} from '../utils/auth.config.utils';
import {saveSatelliteConfig} from '../utils/satellite.config.utils';

export const init = async () => {
  const token = getToken();

  if (!token) {
    console.log(`No controller found. Run ${cyan('login')} to get started 🚀.`);
    return;
  }

  const satellites = getAuthSatellites();

  let satellite = await (satellites?.length > 0 ? promptSatellites(satellites) : promptSatellite());

  if (satellite === '_manual_') {
    satellite = await promptSatellite();
  }

  const source = await promptSource();

  await saveSatelliteConfig({satelliteId: satellite, source});
};

const promptSatellites = async (satellites: AuthSatelliteConfig[]): Promise<string> => {
  const {satellite} = await prompts({
    type: 'select',
    name: 'satellite',
    message: 'Which satellite should be linked with this dapp?',
    choices: [
      ...satellites.map(({p, n}) => ({title: n, value: p})),
      {title: '<not listed, manual entry>', value: '_manual_'}
    ],
    initial: 0
  });

  // In case of control+c
  if (satellite === undefined || satellite === '') {
    process.exit(1);
  }

  return satellite;
};

const promptSatellite = async (): Promise<string> => {
  const {satellite} = await prompts([
    {
      type: 'text',
      name: 'satellite',
      message: `What's the ${cyan('id')} of your satellite?`
    }
  ]);

  if (satellite === undefined || satellite === '') {
    console.log(`${red('The satellite ID is mandatory')}`);
    process.exit(1);
  }

  return satellite;
};

const promptSource = async (): Promise<string> => {
  const {source} = await prompts([
    {
      type: 'text',
      name: 'source',
      message: `What's the name or path of the build ${cyan('source')} folder of your dapp?`,
      initial: 'build'
    }
  ]);

  if (source === undefined || source === '') {
    process.exit(1);
  }

  return source;
};
