import {compare} from 'semver';
import {getReleasesMetadata} from '../rest/cdn.rest';
import {type AssetKeys} from '../types/asset-key';

export const lastRelease = async (assetKeys: AssetKeys): Promise<string | undefined> => {
  try {
    const metadata = await getReleasesMetadata();
    const versions = metadata[assetKeys].sort((a, b) => compare(a, b));

    const last = <T>(elements: T[]): T | undefined => {
      const {length, [length - 1]: last} = elements;
      return last;
    };

    return last(versions);
  } catch (err: unknown) {
    return undefined;
  }
};

export const newerReleases = async ({
  currentVersion,
  assetKeys
}: {
  currentVersion: string;
  assetKeys: AssetKeys;
}): Promise<{result: string[] | undefined; error?: string}> => {
  try {
    const metadata = await getReleasesMetadata();

    return {
      result: metadata[assetKeys].filter((version) => compare(currentVersion, version) === -1)
    };
  } catch (err: unknown) {
    return {result: undefined, error: "Cannot fetch new releases from Juno's CDN 😢."};
  }
};
