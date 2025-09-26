import {isNullish} from '@dfinity/utils';
import {type EmulatorConfig, type NetworkServices} from '@junobuild/config';

// The Docker image has for default the modules that are bootstrapped
// for the Console and Skylab. Satellite as a reduced
// numbers of services.
const SATELLITE_DEFAULT_NETWORK_SERVICES: Readonly<NetworkServices> = {
  icp: true,
  ii: true
} as const;

export const mapEmulatorNetworkServices = ({
  config
}: {
  config: EmulatorConfig;
}): NetworkServices | undefined => {
  const {network} = config;

  // The Docker image use a default set of features.
  // ENV NETWORK_SERVICES='{\
  //   "registry": false, \
  //   "cmc": true, \
  //   "icp": true, \
  //   "cycles": true, \
  //   "nns": true, \
  //   "sns": false, \
  //   "ii": true, \
  //   "nnsDapp": false \
  // }'
  const defaultEnv = 'satellite' in config ? SATELLITE_DEFAULT_NETWORK_SERVICES : undefined;

  if (isNullish(network)) {
    return defaultEnv;
  }

  const {services} = network;
  return services;
};
