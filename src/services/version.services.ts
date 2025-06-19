import {isNullish, nonNullish} from '@dfinity/utils';
import {
  findJunoPackageDependency,
  getJunoPackage,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {JUNO_PACKAGE_SATELLITE_ID} from '@junobuild/config';
import {red} from 'kleur';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const getSatelliteVersion = async (): Promise<
  {result: 'success'; version: string} | {result: 'error'}
> => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId, ...actorParams} = satellite;

  const pkg = await getJunoPackage({
    moduleId: satelliteId,
    ...actorParams
  });

  if (nonNullish(pkg)) {
    const {dependencies, version} = pkg;

    // It's a stock Satellite
    if (isNullish(dependencies)) {
      return {result: 'success', version};
    }

    // It's extended, we search for the dependency.
    const satelliteDependency = findJunoPackageDependency({
      dependencies,
      dependencyId: JUNO_PACKAGE_SATELLITE_ID
    });

    if (isNullish(satelliteDependency)) {
      console.log(red(`Cannot retrieve the current version of your Satellite 😢.`));
      return {result: 'error'};
    }

    const [_, versionSatellite] = satelliteDependency;
    return {result: 'success', version: versionSatellite};
  }

  // Legacy
  const legacyVersion = await satelliteVersionLib({
    satellite
  });

  return {result: 'success', version: legacyVersion};
};
