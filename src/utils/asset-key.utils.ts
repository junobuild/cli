import {AssetKey, AssetKeys} from '../types/asset-key';

export const toAssetKeys = (assetKey: AssetKey): AssetKeys => {
  switch (assetKey) {
    case 'orbiter':
      return 'orbiters';
    case 'mission_control':
      return 'mission_controls';
    default:
      return 'satellites';
  }
};
