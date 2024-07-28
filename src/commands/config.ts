import {ICManagementCanister, LogVisibility} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {type SatelliteParameters, setAuthConfig, setConfig} from '@junobuild/admin';
import {ModuleSettings} from '@junobuild/config';
import {isNullish} from '@junobuild/utils';
import ora from 'ora';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {initAgent} from '../utils/actor.utils';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const config = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);
  const {storage, authentication, settings} = satelliteConfig;

  const satellite = satelliteParameters({satellite: satelliteConfig, env});

  const spinner = ora(`Configuring...`).start();

  try {
    await Promise.allSettled([
      setConfig({
        config: {
          storage: {
            headers: storage?.headers ?? [],
            rewrites: storage?.rewrites,
            redirects: storage?.redirects,
            iframe: storage?.iframe,
            rawAccess: storage?.rawAccess
          }
        },
        satellite
      }),
      ...(isNullish(authentication)
        ? []
        : [
            setAuthConfig({
              config: {
                authentication
              },
              satellite
            })
          ]),
      ...(isNullish(settings) ? [] : [setSettings({settings, satellite})])
    ]);
  } finally {
    spinner.stop();
  }
};

const setSettings = async ({
  settings,
  satellite
}: {
  settings: ModuleSettings;
  satellite: Omit<SatelliteParameters, 'satelliteId'> &
    Required<Pick<SatelliteParameters, 'satelliteId'>>;
}) => {
  const {
    freezingThreshold,
    reservedCyclesLimit,
    logVisibility,
    heapMemoryLimit,
    memoryAllocation,
    computeAllocation
  } = settings;

  const {satelliteId} = satellite;

  const agent = await initAgent();

  const {updateSettings} = ICManagementCanister.create({
    agent
  });

  await updateSettings({
    canisterId: Principal.fromText(satelliteId),
    settings: {
      freezingThreshold,
      reservedCyclesLimit,
      logVisibility: isNullish(logVisibility)
        ? undefined
        : logVisibility === 'public'
          ? LogVisibility.Public
          : LogVisibility.Controllers,
      wasmMemoryLimit: heapMemoryLimit,
      memoryAllocation,
      computeAllocation
    }
  });
};
