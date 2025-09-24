import {isNullish, nonNullish} from '@dfinity/utils';
import {
  getAuthConfig,
  getDatastoreConfig,
  getStorageConfig,
  listRules,
  type ListRulesResults,
  setAuthConfig,
  setDatastoreConfig,
  setRule,
  setStorageConfig
} from '@junobuild/admin';
import {hasArgs} from '@junobuild/cli-tools';
import type {
  AuthenticationConfig,
  DatastoreCollection,
  DatastoreConfig,
  ModuleSettings,
  Rule,
  RulesType,
  SatelliteConfig,
  StorageCollection,
  StorageConfig
} from '@junobuild/config';
import {red, yellow} from 'kleur';
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
  type CliStateSatelliteAppliedCollection,
  type CliStateSatelliteAppliedConfigHashes,
  type ConfigHash,
  type RuleHash,
  type SettingsHash
} from '../../types/cli.state';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {objHash} from '../../utils/obj.utils';
import {isHeadless} from '../../utils/process.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {getSettings, setSettings} from './settings.services';

type SetConfigResults = [
  PromiseSettledResult<StorageConfig | void>,
  PromiseSettledResult<DatastoreConfig | void>,
  PromiseSettledResult<AuthenticationConfig | void>,
  PromiseSettledResult<void>,
  PromiseSettledResult<undefined | Array<PromiseSettledResult<Rule>>>,
  PromiseSettledResult<undefined | Array<PromiseSettledResult<Rule>>>
];

type EditConfig = Omit<SatelliteConfig, 'assertions'>;

export const applyConfig = async (args?: string[]) => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  // Load configurations and rules from the Satellite
  const currentConfig = await loadCurrentConfig({satellite, satelliteConfig});

  // Get the hashes from the CLI state
  const lastAppliedConfig = getLatestAppliedConfig({satelliteId});

  // Apply configuration regardless of whether differences are noticed
  const force = hasArgs({args, options: ['--force']});

  // Compare last hashes with current configuration of the Satellite
  // Prompt the user if there will be an overwrite
  // Extends the configuration provided by the dev with the version fields (unless they specified the field themselves)
  const editConfig = await prepareConfig({
    currentConfig,
    lastAppliedConfig,
    satelliteConfig,
    force
  });

  if (Object.values(editConfig).filter(nonNullish).length === 0) {
    console.log('🤷‍♂️ No configuration changes detected.');
    return;
  }

  // Effectively update the configurations and collections of the Satellite
  const results = await executeSetConfigs({satellite, editConfig});

  // Save the new hashes in the CLI state
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
    index: 0 | 1 | 2
  ): void | StorageConfig | DatastoreConfig | AuthenticationConfig | undefined =>
    results[index].status === 'fulfilled' ? results[index].value : undefined;

  const storage = fulfilledValue(0);
  const datastore = fulfilledValue(1);
  const auth = fulfilledValue(2);

  const fulfilledCollectionsValues = (
    index: 4 | 5
  ): Record<CliStateSatelliteAppliedCollection, RuleHash> | undefined =>
    results[index].status === 'fulfilled'
      ? results[index].value
          ?.map((ruleResult) => (ruleResult.status === 'fulfilled' ? ruleResult.value : undefined))
          .filter(nonNullish)
          .reduce<Record<CliStateSatelliteAppliedCollection, RuleHash>>(
            (acc, rule) => ({
              ...acc,
              [rule.collection]: ruleHash(rule)
            }),
            {}
          )
      : undefined;

  const storageCollections = fulfilledCollectionsValues(4);
  const datastoreCollections = fulfilledCollectionsValues(5);

  const lastAppliedConfig: CliStateSatelliteAppliedConfigHashes = {
    storage: nonNullish(storage) ? objHash(storage) : undefined,
    datastore: nonNullish(datastore) ? objHash(datastore) : undefined,
    auth: nonNullish(auth) ? objHash(auth) : undefined,
    settings: nonNullish(settings) ? objHash(settings) : undefined,
    collections:
      nonNullish(storageCollections) || nonNullish(datastoreCollections)
        ? {
            storage: storageCollections,
            datastore: datastoreCollections
          }
        : undefined
  };

  saveLastAppliedConfig({lastAppliedConfig, satelliteId});
};

const printResults = (results: SetConfigResults) => {
  const configErrors = results.filter((result) => result.status === 'rejected');

  const filterCollectionsErrors = (index: 4 | 5): PromiseRejectedResult[] =>
    results[index].status === 'fulfilled'
      ? (results[index].value ?? []).filter((result) => result.status === 'rejected')
      : [];

  const collectionsErrors = [...filterCollectionsErrors(4), ...filterCollectionsErrors(5)];

  const errors = [...configErrors, ...collectionsErrors];

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
  satelliteConfig: EditConfig;
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
        [rule.collection]: [rule, ruleHash(rule)]
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
  satelliteConfig: EditConfig;
}): Promise<CurrentConfig> => {
  const spinner = ora('Loading configuration...').start();

  try {
    return await getCurrentConfig(params);
  } finally {
    spinner.stop();
  }
};

const executeSetConfigs = async ({
  satellite,
  editConfig
}: {
  satellite: SatelliteParametersWithId;
  editConfig: EditConfig;
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
  editConfig: EditConfig;
}): Promise<SetConfigResults> => {
  const {storage, authentication, datastore, settings, collections} = editConfig;

  const storageCollections = collections?.storage;
  const datastoreCollections = collections?.datastore;

  const setRules = async ({
    collections,
    type
  }: {
    collections: Array<StorageCollection | DatastoreCollection>;
    type: RulesType;
  }): Promise<Array<PromiseSettledResult<Rule>>> => {
    return await Promise.allSettled(
      collections.map(
        async (collection) =>
          await setRule({
            rule: collection,
            type,
            satellite
          })
      )
    );
  };

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
    isNullish(settings) ? Promise.resolve() : setSettings({settings, satellite}),
    isNullish(storageCollections) || storageCollections.length === 0
      ? Promise.resolve(undefined)
      : setRules({
          type: 'storage',
          collections: storageCollections
        }),
    isNullish(datastoreCollections) || datastoreCollections.length === 0
      ? Promise.resolve(undefined)
      : setRules({
          type: 'db',
          collections: datastoreCollections
        })
  ]);
};

const prepareConfig = async ({
  currentConfig,
  lastAppliedConfig,
  satelliteConfig,
  force
}: {
  currentConfig: CurrentConfig;
  lastAppliedConfig: CliStateSatelliteAppliedConfigHashes | undefined;
  satelliteConfig: EditConfig;
  force: boolean;
}): Promise<EditConfig> => {
  const {
    storage: currentStorage,
    datastore: currentDatastore,
    auth: currentAuth,
    settings: currentSettings,
    storageCollections: currentStorageCollections,
    datastoreCollections: currentDatastoreCollections
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

  // The dev has never applied a configuration, changed the settings or even created a single collection
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

    const hasStorageCollections =
      nonNullish(currentStorageCollections) && Object.keys(currentStorageCollections).length > 0;

    if (hasStorageCollections) {
      return false;
    }

    const hasDatastoreCollections =
      nonNullish(currentDatastoreCollections) &&
      Object.keys(currentDatastoreCollections).length > 0;

    if (hasDatastoreCollections) {
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

  const {storage, datastore, authentication, settings, collections} = satelliteConfig;

  const storageCollections = collections?.storage;
  const datastoreCollections = collections?.datastore;

  // Extend the satellite config from the juno.config with the current versions available in the backend
  // Unless the config contains manually defined versions.
  const extendWithVersions = (): EditConfig => {
    const versionStorage = currentStorage?.[0]?.version;
    const versionDatastore = currentDatastore?.[0]?.version;
    const versionAuth = currentAuth?.[0]?.version;

    const extendCollections = ({
      collections,
      currentCollections
    }: {
      collections: Array<StorageCollection | DatastoreCollection> | undefined;
      currentCollections: CurrentCollectionsConfig | undefined;
    }): Array<StorageCollection | DatastoreCollection> =>
      (collections ?? []).map(({collection, version, ...rest}) => ({
        ...rest,
        collection,
        version: version ?? currentCollections?.[collection]?.[0].version
      }));

    const extendedStorageCollections = extendCollections({
      collections: storageCollections,
      currentCollections: currentStorageCollections
    });

    const extendedDatastoreCollections = extendCollections({
      collections: datastoreCollections,
      currentCollections: currentDatastoreCollections
    });

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
      settings,
      ...(nonNullish(collections) && {
        collections: {
          ...(nonNullish(storageCollections) && {storage: extendedStorageCollections}),
          ...(nonNullish(datastoreCollections) && {datastore: extendedDatastoreCollections})
        }
      })
    };
  };

  // We want to spare updates if there is no changes to apply
  const filterIdenticalConfig = (editConfig: EditConfig): EditConfig => {
    const {storage, datastore, authentication, settings, collections} = editConfig;

    const storageHash = currentStorage?.[1];
    const datastoreHash = currentDatastore?.[1];
    const authHash = currentAuth?.[1];
    const settingsHash = currentSettings?.[1];

    const filterCollections = ({
      collections,
      currentCollections
    }: {
      collections?: Array<StorageCollection | DatastoreCollection>;
      currentCollections?: CurrentCollectionsConfig;
    }): Array<StorageCollection | DatastoreCollection> | undefined =>
      collections?.filter((rule) => {
        const currentHash = currentCollections?.[rule.collection]?.[1];

        const extendRuleWithDefault = {
          ...rule,
          ...(!('mutablePermissions' in rule) && {mutablePermissions: true})
        };

        return isNullish(currentHash) || currentHash !== objHash(extendRuleWithDefault);
      });

    const storageCollections = filterCollections({
      collections: collections?.storage,
      currentCollections: currentStorageCollections
    });

    const datastoreCollections = filterCollections({
      collections: collections?.datastore,
      currentCollections: currentDatastoreCollections
    });

    return {
      storage:
        nonNullish(storageHash) && nonNullish(storage) && storageHash === objHash(storage)
          ? undefined
          : storage,
      datastore:
        nonNullish(datastoreHash) && nonNullish(datastore) && datastoreHash === objHash(datastore)
          ? undefined
          : datastore,
      authentication:
        nonNullish(authHash) && nonNullish(authentication) && authHash === objHash(authentication)
          ? undefined
          : authentication,
      settings:
        nonNullish(settingsHash) && nonNullish(settings) && settingsHash === objHash(settings)
          ? undefined
          : settings,
      ...(((nonNullish(storageCollections) && storageCollections.length > 0) ||
        (nonNullish(datastoreCollections) && datastoreCollections.length > 0)) && {
        collections: {
          ...(nonNullish(storageCollections) &&
            storageCollections.length > 0 && {storage: storageCollections}),
          ...(nonNullish(datastoreCollections) &&
            datastoreCollections.length > 0 && {datastore: datastoreCollections})
        }
      })
    };
  };

  const confirmAndExtendWithVersions = async (): Promise<EditConfig> => {
    if (force) {
      return filterIdenticalConfig(extendWithVersions());
    }

    if (isHeadless()) {
      console.log(
        yellow('Non-interactive mode detected. Re-run with --force to overwrite without checks.')
      );
      process.exit(1);
    }

    await confirmAndExit(
      'This action will overwrite the current configuration of the Satellite. Are you sure you want to continue?'
    );

    return filterIdenticalConfig(extendWithVersions());
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
      settings: lastSettingsHash,
      collections: lastCollectionsHashes
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

    const isLastAppliedCollectionsCurrent = ({
      lastCollectionsHashes,
      currentCollections
    }: {
      lastCollectionsHashes?: Record<CliStateSatelliteAppliedCollection, RuleHash> | undefined;
      currentCollections?: CurrentCollectionsConfig;
    }): boolean =>
      Object.entries(lastCollectionsHashes ?? {}).every(
        ([collection, lastHash]) => currentCollections?.[collection]?.[1] === lastHash
      );

    if (
      !isLastAppliedCollectionsCurrent({
        lastCollectionsHashes: lastCollectionsHashes?.storage,
        currentCollections: currentStorageCollections
      })
    ) {
      return false;
    }
    if (
      !isLastAppliedCollectionsCurrent({
        lastCollectionsHashes: lastCollectionsHashes?.datastore,
        currentCollections: currentDatastoreCollections
      })
    ) {
      return false;
    }

    const settingsHash = currentSettings?.[1];

    return (
      (nonNullish(settingsHash) && settingsHash === lastSettingsHash) ||
      (isNullishOrDefaultSettings() && isNullish(settings))
    );
  };

  if (isLastAppliedConfigCurrent()) {
    return filterIdenticalConfig(extendWithVersions());
  }

  return await confirmAndExtendWithVersions();
};

// We trim `createdAt` and `updatedAt` because they are not used when applying or handling the configuration.
// They are also excluded when generating hashes to ensure comparisons are based only on meaningful changes.
// This allows us to determine whether a collection truly needs to be created or updated, or if it already matches
// the configuration definition.
const ruleHash = ({createdAt: _, updatedAt: __, ...rule}: Rule): string => objHash(rule);
