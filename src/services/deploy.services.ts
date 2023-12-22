import {satelliteMemorySize, satelliteVersion} from '@junobuild/admin';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {readSatelliteConfig} from '../configs/juno.config';
import {MEMORY_HEAP_WARNING, MEMORY_SIZE_ENDPOINT_VERSION} from '../constants/deploy.constants';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const assertSatelliteMemorySize = async () => {
  const {satelliteId} = await readSatelliteConfig();

  const satellite = satelliteParameters(satelliteId);

  const currentVersion = await satelliteVersion({
    satellite
  });

  if (compare(currentVersion, MEMORY_SIZE_ENDPOINT_VERSION) < 0) {
    console.log(
      `Your satellite (${yellow(
        `v${currentVersion}`
      )}) is not up-to-date, and the memory size cannot be verified.${NEW_CMD_LINE}`
    );
    return;
  }

  const {heap} = await satelliteMemorySize({satellite});

  if (heap < MEMORY_HEAP_WARNING) {
    return;
  }

  await confirmAndExit(
    `⚠️  Your satellite's heap memory is ${Intl.NumberFormat('en-US', {
      maximumSignificantDigits: 3
    }).format(
      Number(heap) / 1_000_000
    )} MB. It is approaching 1 GB, which is the recommended upper limit. Are you sure you want to deploy?`
  );
};
