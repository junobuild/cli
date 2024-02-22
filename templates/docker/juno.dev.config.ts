import {defineDevConfig} from '@junobuild/config';

export default defineDevConfig(() => ({
  satellite: {
    collections: {
      db: [],
      storage: []
    },
    controllers: []
  }
}));
