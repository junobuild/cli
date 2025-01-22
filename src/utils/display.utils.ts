import type {AssetKey} from '../types/asset-key';

export const displaySegment = (segment: AssetKey): string => {
  switch (segment) {
    case 'orbiter':
      return 'orbiter';
    case 'mission_control':
      return 'mission control';
    default:
      return 'satellite';
  }
};
