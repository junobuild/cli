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
  /**
   * Headers allow the client and the satellite to pass additional information along with a request or a response. Some sets of headers can affect how the browser handles the page and its content.
   * Notes:
   * - "Content-Type" header is automatically computed and cannot be overwritten.
   * - No validation nor check for uniqueness is applied - e.g. if a same header matches a file against multiple rules, multiple headers will be set
   */
  headers?: SatelliteConfigHeaders;
}

export type SatelliteConfigHeaders = {source: string; headers: [string, string][]}[];
