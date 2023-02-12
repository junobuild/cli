import {StorageConfig} from '@junobuild/admin';

export interface SatelliteConfig {
  /**
   * The ID of the satellite to control from the folder where the juno.json config file is located.
   * e.g. the satellite to which the app should be deployed
   */
  satelliteId: string;
  /**
   * The "source" attribute specifies which directory to deploy to the storage. Default: build
   */
  source?: string;
  /**
   * Optional configuration parameters that can be applied to the satellite - i.e. parameters that change the behavior of the satellite on chain.
   * Any changes to these parameters need to be applied manually afterwards with `npm run ... config`
   */
  storage?: StorageConfig;
  /**
   * The "ignore" attribute specifies the files to ignore on deploy. It can take globs the same way that Git handles .gitignore.
   */
  ignore?: string[];
}
