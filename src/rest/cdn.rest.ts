import type {ReleasesMetadata} from '@junobuild/admin';
import {JUNO_CDN_URL} from '../constants/constants';

export const getReleasesMetadata = async (): Promise<ReleasesMetadata> => {
  const response = await fetch(`${JUNO_CDN_URL}/releases/metadata.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Fetching releases metadata failed.`);
  }

  const result: ReleasesMetadata = await response.json();

  return result;
};
