import {ICManagementCanister, LogVisibility} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {
  type SatelliteParameters,
  setAuthConfig,
  setDatastoreConfig,
  setStorageConfig
} from '@junobuild/admin';
import type {ModuleSettings} from '@junobuild/config';
import {red} from 'kleur';
import ora from 'ora';
import {initAgent} from '../api/agent.api';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const config = async () => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const {storage, authentication, datastore, settings} = satelliteConfig;

  const spinner = ora(`Configuring...`).start();

  let results: Array<PromiseSettledResult<void>> = [];

  try {
    results = await Promise.allSettled([
      setStorageConfig({
        config: {
          headers: storage?.headers ?? [],
          rewrites: storage?.rewrites,
          redirects: storage?.redirects,
          iframe: storage?.iframe,
          rawAccess: storage?.rawAccess,
          maxMemorySize: storage?.maxMemorySize
        },
        satellite
      }),
      ...(isNullish(datastore)
        ? []
        : [
            setDatastoreConfig({
              config: datastore,
              satellite
            })
          ]),
      ...(isNullish(authentication)
        ? []
        : [
            setAuthConfig({
              config: authentication,
              satellite
            })
          ]),
      ...(isNullish(settings) ? [] : [setSettings({settings, satellite})])
    ]);
  } finally {
    spinner.stop();
  }

  printResults(results);
};

const printResults = (results: Array<PromiseSettledResult<void>>) => {
  const errors = results.filter((result) => result.status === 'rejected');

  if (errors.length === 0) {
    console.log('✅ Configuration applied.');
    return;
  }

  console.log(
    red(`The configuration failed with ${errors.length} error${errors.length > 1 ? 's' : ''} 😢.`)
  );

  errors.forEach((error, index) => {
    console.log(`${index}:`, error.reason);
  });
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
