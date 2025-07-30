import {ICManagementCanister, LogVisibility} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import type {ModuleSettings} from '@junobuild/config';
import {initAgent} from '../../api/agent.api';
import type {SatelliteParametersWithId} from '../../types/satellite';

export const getSettings = async ({
  satellite
}: {
  satellite: SatelliteParametersWithId;
}): Promise<ModuleSettings> => {
  const {satelliteId} = satellite;

  const agent = await initAgent();

  const {canisterStatus} = ICManagementCanister.create({
    agent
  });

  const {
    settings: {
      freezing_threshold: freezingThreshold,
      reserved_cycles_limit: reservedCyclesLimit,
      wasm_memory_limit: heapMemoryLimit,
      memory_allocation: memoryAllocation,
      compute_allocation: computeAllocation,
      log_visibility
    }
  } = await canisterStatus(Principal.fromText(satelliteId));

  return {
    freezingThreshold,
    reservedCyclesLimit,
    logVisibility: 'public' in log_visibility ? 'public' : 'controllers',
    heapMemoryLimit,
    memoryAllocation,
    computeAllocation
  };
};

export const setSettings = async ({
  settings,
  satellite
}: {
  settings: ModuleSettings;
  satellite: SatelliteParametersWithId;
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
