import {isNullish, nonNullish} from '@dfinity/utils';
import {
  getAuthConfig,
  getDatastoreConfig,
  getStorageConfig,
  listRules,
  ListRulesResults,
  setAuthConfig,
  setDatastoreConfig,
  setStorageConfig
} from '@junobuild/admin';
import type {
  AuthenticationConfig,
  DatastoreConfig,
  ModuleSettings,
  Rule,
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
  RuleHash,
  type SettingsHash
} from '../../types/cli.state';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {objHash} from '../../utils/obj.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {getSettings, setSettings} from './settings.services';

type SetConfigResults = [
  PromiseSettledResult<StorageConfig | void>,
  PromiseSettledResult<DatastoreConfig | void>,
  PromiseSettledResult<AuthenticationConfig | void>,
  PromiseSettledResult<void>
];

export const config = async () => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  const currentConfig = await loadCurrentConfig({satellite, satelliteConfig});

  console.log(currentConfig);

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

type CurrentCollectionsConfig = Record<string, [Rule, RuleHash]>;

interface CurrentConfig {
  storage?: [StorageConfig, ConfigHash];
  datastore?: [DatastoreConfig, ConfigHash];
  auth?: [AuthenticationConfig, ConfigHash];
  settings?: [ModuleSettings, SettingsHash];
  storageCollections?: CurrentCollectionsConfig;
  datastoreCollections?: CurrentCollectionsConfig;
}

const getCurrentConfig = async ({
  satellite,
  satelliteConfig
}: {
  satellite: SatelliteParametersWithId;
  satelliteConfig: Omit<SatelliteConfig, 'assertions'>;
}): Promise<CurrentConfig> => {
  const {
    storage: userStorageConfig,
    datastore: userDatastoreConfig,
    authentication: userAuthConfig,
    settings: userSettingConfig,
    collections: userCollectionsConfig
  } = satelliteConfig;

  const userStorageCollectionsConfig = userCollectionsConfig?.storage;
  const userDatastoreCollectionsConfig = userCollectionsConfig?.datastore;

  const [storage, datastore, auth, settings, storageCollections, datastoreCollections] =
    await Promise.all([
      nonNullish(userStorageConfig) ? getStorageConfig({satellite}) : Promise.resolve(),
      nonNullish(userDatastoreConfig) ? getDatastoreConfig({satellite}) : Promise.resolve(),
      nonNullish(userAuthConfig) ? getAuthConfig({satellite}) : Promise.resolve(),
      nonNullish(userSettingConfig) ? getSettings({satellite}) : Promise.resolve(),
      nonNullish(userStorageCollectionsConfig) && userStorageCollectionsConfig.length > 0
        ? listRules({type: 'storage', satellite})
        : Promise.resolve(undefined),
      nonNullish(userDatastoreCollectionsConfig) && userDatastoreCollectionsConfig.length > 0
        ? listRules({type: 'db', satellite})
        : Promise.resolve(undefined)
    ]);

  const mapRules = ({items}: ListRulesResults): CurrentCollectionsConfig =>
    items.reduce<CurrentCollectionsConfig>(
      (acc, rule) => ({
        ...acc,
        [rule.collection]: [rule, objHash(rule)]
      }),
      {}
    );

  return {
    ...(nonNullish(storage) && {storage: [storage, objHash(storage)]}),
    ...(nonNullish(datastore) && {datastore: [datastore, objHash(datastore)]}),
    ...(nonNullish(auth) && {auth: [auth, objHash(auth)]}),
    ...(nonNullish(settings) && {settings: [settings, objHash(settings)]}),
    ...(nonNullish(storageCollections) && {storageCollections: mapRules(storageCollections)}),
    ...(nonNullish(datastoreCollections) && {datastoreCollections: mapRules(datastoreCollections)})
  };
};

const loadCurrentConfig = async (params: {
  satellite: SatelliteParametersWithId;
  satelliteConfig: Omit<SatelliteConfig, 'assertions'>;
}): Promise<CurrentConfig> => {
  const spinner = ora('Loading configuration...').start();

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

  const isNullishOrDefaultSettings = (): boolean => {
    if (isNullish(currentSettings)) {
      return true;
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

  const isDefaultConfig = (): boolean => {
    const storageVersion = currentStorage?.[0].version;

    if (nonNullish(storageVersion)) {
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

    return isNullishOrDefaultSettings();
  };

  const firstTime = isNullish(lastAppliedConfig);

  // If the developer runs `juno config` for the first time using the default configuration,
  // there's no need to show a warning about overwriting an existing config - it's the first time
  // they want to configure something.
  if (firstTime && isDefaultConfig()) {
    return satelliteConfig;
  }

  const {storage, datastore, authentication, settings} = satelliteConfig;

  // Extend the satellite config from the juno.config with the current versions available in the backend
  // Unless the config contains manually defined versions.
  const extendWithVersions = (): Omit<SatelliteConfig, 'assertions'> => {
    const versionStorage = currentStorage?.[0]?.version;
    const versionDatastore = currentDatastore?.[0]?.version;
    const versionAuth = currentAuth?.[0]?.version;

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

  if (firstTime) {
    return await confirmAndExtendWithVersions();
  }

  // Checks whether the last applied config (hashes stored in the CLI state file)
  // matches the current Satellite configuration.
  // If they match, there's no need to warn the developer about overwriting —
  // they're just updating the same options they previously applied.
  const isLastAppliedConfigCurrent = (): boolean => {
    const {
      storage: lastStorageHash,
      datastore: lastDatastoreHash,
      auth: lastAuthHash,
      settings: lastSettingsHash
    } = lastAppliedConfig;

    const storageHash = currentStorage?.[1];

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

    const settingsHash = currentSettings?.[1];

    return (
      (nonNullish(settingsHash) && settingsHash === lastSettingsHash) ||
      (isNullishOrDefaultSettings() && isNullish(settings))
    );
  };

  if (isLastAppliedConfigCurrent()) {
    return extendWithVersions();
  }

  return await confirmAndExtendWithVersions();
};
