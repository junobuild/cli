import {compare} from 'semver';
import {getReleasesMetadata} from './cdn.utils';

export const lastRelease = async (
  segments: 'mission_controls' | 'satellites'
): Promise<string | undefined> => {
  try {
    const metadata = await getReleasesMetadata();
    const versions = metadata[segments].sort((a, b) => compare(a, b));

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
  segments
}: {
  currentVersion: string;
  segments: 'mission_controls' | 'satellites';
}): Promise<{result: string[] | undefined; error?: string}> => {
  try {
    const metadata = await getReleasesMetadata();

    return {
      result: metadata[segments].filter((version) => compare(currentVersion, version) === -1)
    };
  } catch (err: unknown) {
    return {result: undefined, error: "Cannot fetch new releases from Juno's CDN 😢."};
  }
};
