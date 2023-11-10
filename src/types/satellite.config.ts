import {type StorageConfig} from '@junobuild/admin';
import {type ENCODING_TYPE} from '@junobuild/core-peer';

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
   * By default, the CLI searches for JavaScript (js), ES Module (mjs), and CSS (css) files in the source folder and optimizes them with Gzip compression.
   * You can customize this behavior by either turning it off or providing a different file matching pattern using glob syntax.
   */
  gzip?: string | false;
  /**
   * The CLI maps the encoding type according to the file extension. Encoding is then used in the satellite to provide the HTTP response header `Content-Encoding`.
   *
   * .Z = compress
   * .gz = gzip
   * .br = br
   * .zlib = deflate
   * rest = identity
   *
   * The "encoding" attribute can be used to overwrite the default mapping. It can take globs the same way that Git handles .gitignore.
   */
  encoding?: Array<[string, ENCODING_TYPE]>;
}
