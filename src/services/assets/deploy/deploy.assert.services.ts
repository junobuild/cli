import {satelliteMemorySize, satelliteVersion} from '@junobuild/admin';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {
  MEMORY_HEAP_WARNING,
  MEMORY_SIZE_ENDPOINT_VERSION
} from '../../../constants/deploy.constants';
import {isHeadless} from '../../../utils/process.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../../../utils/prompt.utils';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';

export const assertSatelliteMemorySize = async () => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();

  const {assertions} = satelliteConfig;

  if (assertions?.heapMemory === false) {
    return;
  }

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

  const maxMemorySize =
    assertions?.heapMemory !== undefined && typeof assertions.heapMemory !== 'boolean'
      ? BigInt(assertions.heapMemory)
      : MEMORY_HEAP_WARNING;

  const {heap} = await satelliteMemorySize({satellite});

  if (heap < maxMemorySize) {
    return;
  }

  const formatNumber = (value: bigint): string =>
    Intl.NumberFormat('en-US', {
      maximumSignificantDigits: 3
    }).format(Number(value) / 1_000_000);

  const errorText = `⚠️  Your satellite's heap memory is ${formatNumber(
    heap
  )} MB, which exceeds the enforced limit of ${formatNumber(maxMemorySize)} MB.`;

  if (isHeadless()) {
    console.log(yellow(errorText));
    process.exit(1);
  }

  await confirmAndExit(`${errorText} Are you sure you want to proceed with the deployment?`);
};
