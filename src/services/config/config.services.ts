import {isNullish, nonNullish} from '@dfinity/utils';
import {
  getAuthConfig,
  getDatastoreConfig,
  getStorageConfig,
  setAuthConfig,
  setDatastoreConfig,
  setStorageConfig
} from '@junobuild/admin';
import type {
  AuthenticationConfig,
  DatastoreConfig,
  ModuleSettings,
  SatelliteConfig,
  StorageConfig
} from '@junobuild/config';
import {red} from 'kleur';
import ora from 'ora';
import {getLatestAppliedConfig, saveLastAppliedConfig} from '../../configs/cli.state.config';
import {
  DEFAULT_COMPUTE_ALLOCATION,
  DEFAULT_LOG_VISIBILITY,
  DEFAULT_MEMORY_ALLOCATION,
  DEFAULT_RESERVED_CYCLES_LIMIT,
  DEFAULT_SATELLITE_FREEZING_THRESHOLD,
  DEFAULT_SATELLITE_HEAP_WASM_MEMORY_LIMIT
} from '../../constants/settings.constants';
import {
  type CliStateSatelliteAppliedConfigHashes,
  type ConfigHash,
  type SettingsHash
} from '../../types/cli.state';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {objHash} from '../../utils/obj.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {getSettings, setSettings} from './settings.services';

type SetConfigResults = [
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PromiseSettledResult<StorageConfig | void>,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PromiseSettledResult<DatastoreConfig | void>,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PromiseSettledResult<AuthenticationConfig | void>,
  PromiseSettledResult<void>
];

export const config = async () => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  const currentConfig = await loadCurrentConfig({satellite});
  const lastAppliedConfig = getLatestAppliedConfig({satelliteId});

  const editConfig = await prepareConfig({
    currentConfig,
    lastAppliedConfig,
    satelliteConfig
  });

  const results = await applyConfig({satellite, editConfig});

  saveLastAppliedConfigHashes({
    results,
    settings: editConfig.settings,
    satelliteId
  });

  printResults(results);
};

const saveLastAppliedConfigHashes = ({
  results,
  settings,
  satelliteId
}: {results: SetConfigResults} & Pick<SatelliteConfig, 'settings'> &
  Pick<SatelliteParametersWithId, 'satelliteId'>) => {
  const fulfilledValue = (
    index: number
  ): void | StorageConfig | DatastoreConfig | AuthenticationConfig | undefined =>
    results[index].status === 'fulfilled' ? results[index].value : undefined;

  const storage = fulfilledValue(0);
  const datastore = fulfilledValue(1);
  const auth = fulfilledValue(2);

  const lastAppliedConfig: CliStateSatelliteAppliedConfigHashes = {
    storage: nonNullish(storage) ? objHash(storage) : undefined,
    datastore: nonNullish(datastore) ? objHash(datastore) : undefined,
    auth: nonNullish(auth) ? objHash(auth) : undefined,
    settings: nonNullish(settings) ? objHash(settings) : undefined
  };

  console.log(lastAppliedConfig, results);

  saveLastAppliedConfig({lastAppliedConfig, satelliteId});
};

const printResults = (results: SetConfigResults) => {
  const errors = results.filter((result) => result.status === 'rejected');

  if (errors.length === 0) {
    console.log('✅ Configuration applied.');
    return;
  }

  console.log(
    red(`The configuration failed with ${errors.length} error${errors.length > 1 ? 's' : ''} 😢.`)
  );

  errors.forEach((error, index) => {
    console.log(`${index}:`, error.reason instanceof Error ? error.reason.message : error.reason);
  });
};

interface CurrentConfig {
  storage: [StorageConfig, ConfigHash];
  datastore?: [DatastoreConfig, ConfigHash];
  auth?: [AuthenticationConfig, ConfigHash];
  settings: [ModuleSettings, SettingsHash];
}

const getCurrentConfig = async ({
  satellite
}: {
  satellite: SatelliteParametersWithId;
}): Promise<CurrentConfig> => {
  const [storage, datastore, auth, settings] = await Promise.all([
    getStorageConfig({satellite}),
    getDatastoreConfig({satellite}),
    getAuthConfig({satellite}),
    getSettings({satellite})
  ]);

  return {
    storage: [storage, objHash(storage)],
    ...(nonNullish(datastore) && {datastore: [datastore, objHash(datastore)]}),
    ...(nonNullish(auth) && {auth: [auth, objHash(auth)]}),
    settings: [settings, objHash(settings)]
  };
};

const loadCurrentConfig = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<CurrentConfig> => {
  const spinner = ora('Loading...').start();

  try {
    return await getCurrentConfig(params);
  } finally {
    spinner.stop();
  }
};

const applyConfig = async ({
  satellite,
  editConfig
}: {
  satellite: SatelliteParametersWithId;
  editConfig: Omit<SatelliteConfig, 'assertions'>;
}): Promise<SetConfigResults> => {
  const spinner = ora('Configuring...').start();

  try {
    return await setConfigs({satellite, editConfig});
  } finally {
    spinner.stop();
  }
};

const setConfigs = async ({
  satellite,
  editConfig
}: {
  satellite: SatelliteParametersWithId;
  editConfig: Omit<SatelliteConfig, 'assertions'>;
}): Promise<SetConfigResults> => {
  const {storage, authentication, datastore, settings} = editConfig;

  return await Promise.allSettled([
    isNullish(storage)
      ? Promise.resolve()
      : setStorageConfig({
          config: {
            ...storage,
            headers: storage.headers ?? []
          },
          satellite
        }),
    isNullish(datastore)
      ? Promise.resolve()
      : setDatastoreConfig({
          config: datastore,
          satellite
        }),
    isNullish(authentication)
      ? Promise.resolve()
      : setAuthConfig({
          config: authentication,
          satellite
        }),
    isNullish(settings) ? Promise.resolve() : setSettings({settings, satellite})
  ]);
};

const prepareConfig = async ({
  currentConfig,
  lastAppliedConfig,
  satelliteConfig
}: {
  currentConfig: CurrentConfig;
  lastAppliedConfig: CliStateSatelliteAppliedConfigHashes | undefined;
  satelliteConfig: Omit<SatelliteConfig, 'assertions'>;
}): Promise<Omit<SatelliteConfig, 'assertions'>> => {
  const {
    storage: currentStorage,
    datastore: currentDatastore,
    auth: currentAuth,
    settings: currentSettings
  } = currentConfig;

  console.log('---->', lastAppliedConfig);

  const isDefaultConfig = (): boolean => {
    const [storage] = currentStorage;

    if (nonNullish(storage.version)) {
      return false;
    }

    const datastoreVersion = currentDatastore?.[0].version;

    if (nonNullish(datastoreVersion)) {
      return false;
    }

    const authVersion = currentAuth?.[0].version;

    if (nonNullish(authVersion)) {
      return false;
    }

    const [settings] = currentSettings;
    return (
      settings.computeAllocation === DEFAULT_COMPUTE_ALLOCATION &&
      settings.memoryAllocation === DEFAULT_MEMORY_ALLOCATION &&
      settings.heapMemoryLimit === DEFAULT_SATELLITE_HEAP_WASM_MEMORY_LIMIT &&
      settings.freezingThreshold === DEFAULT_SATELLITE_FREEZING_THRESHOLD &&
      settings.reservedCyclesLimit === DEFAULT_RESERVED_CYCLES_LIMIT &&
      settings.logVisibility === DEFAULT_LOG_VISIBILITY
    );
  };

  const firstTime = isNullish(lastAppliedConfig);

  if (firstTime && isDefaultConfig()) {
    return satelliteConfig;
  }

  const {storage, datastore, authentication, settings} = satelliteConfig;

  // Extend the satellite config from the juno.config with the current versions available in the backend
  // Unless the config contains manually defined versions.
  const extendWithVersions = (): Omit<SatelliteConfig, 'assertions'> => {
    const [{version: versionStorage}] = currentStorage;
    const versionDatastore = currentDatastore?.[0]?.version;
    const versionAuth = currentAuth?.[0]?.version;

    console.log('===', storage);

    return {
      storage:
        nonNullish(storage) && isNullish(storage.version)
          ? {...storage, version: versionStorage}
          : storage,
      datastore:
        nonNullish(datastore) && isNullish(datastore.version)
          ? {...datastore, version: versionDatastore}
          : datastore,
      authentication:
        nonNullish(authentication) && isNullish(authentication.version)
          ? {...authentication, version: versionAuth}
          : authentication,
      settings
    };
  };

  const confirmAndExtendWithVersions = async (): Promise<Omit<SatelliteConfig, 'assertions'>> => {
    await confirmAndExit(
      'This action will overwrite the current configuration of the Satellite. Are you sure you want to continue?'
    );

    return extendWithVersions();
  };

  console.log(firstTime, currentConfig, lastAppliedConfig);

  if (firstTime) {
    return await confirmAndExtendWithVersions();
  }

  const isLastAppliedConfigCurrent = (): boolean => {
    const [_, storageHash] = currentStorage;

    const {
      storage: lastStorageHash,
      datastore: lastDatastoreHash,
      auth: lastAuthHash,
      settings: lastSettingsHash
    } = lastAppliedConfig;

    if (storageHash !== lastStorageHash) {
      return false;
    }

    const datastoreHash = currentDatastore?.[1];

    if (datastoreHash !== lastDatastoreHash) {
      return false;
    }

    const authHash = currentAuth?.[1];

    if (authHash !== lastAuthHash) {
      return false;
    }

    const [__, settingsHash] = currentSettings;
    return settingsHash === lastSettingsHash;
  };

  if (isLastAppliedConfigCurrent()) {
    return extendWithVersions();
  }

  return await confirmAndExtendWithVersions();
};
