import {nonNullish} from '@dfinity/utils';
import {type PrincipalText} from '@dfinity/zod-schemas';
import {findJunoPackageDependency, getJunoPackage} from '@junobuild/admin';
import {
  JUNO_PACKAGE_MISSION_CONTROL_ID,
  JUNO_PACKAGE_ORBITER_ID,
  JUNO_PACKAGE_SATELLITE_ID
} from '@junobuild/config';
import {actorParameters} from '../../../api/actor.api';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';

export const assertMatchingJunoPackage = async ({
  canisterId,
  segment
}: {
  canisterId: PrincipalText;
  segment: AssetKey;
}) => {
  const actorParams = await actorParameters();

  const pkg = await getJunoPackage({
    moduleId: canisterId,
    ...actorParams
  });

  const validJunoPackage = (): {valid: boolean} => {
    if (segment === 'mission_control') {
      return {valid: pkg?.name === JUNO_PACKAGE_MISSION_CONTROL_ID};
    }

    if (segment === 'orbiter') {
      return {valid: pkg?.name === JUNO_PACKAGE_ORBITER_ID};
    }

    // It's stock
    if (pkg?.name === JUNO_PACKAGE_SATELLITE_ID) {
      return {valid: true};
    }

    const {dependencies} = pkg ?? {dependencies: {}};

    const satelliteDependency = findJunoPackageDependency({
      dependencies,
      dependencyId: JUNO_PACKAGE_SATELLITE_ID
    });

    return {valid: nonNullish(satelliteDependency)};
  };

  const {valid} = validJunoPackage();

  if (!valid) {
    await confirmAndExit(
      `⚠️  The selected target is not a ${displaySegment(segment)}; this may cause issues if restored later. Are you sure you want to continue?`
    );
  }
};
