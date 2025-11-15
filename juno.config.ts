import {defineConfig} from '@junobuild/config';

export default defineConfig({
  satellite: {
    ids: {
      development: '<DEV_SATELLITE_ID>',
      production: '<PROD_SATELLITE_ID>'
    },
    source: 'e2e/fixtures',
    precompress: false,
    collections: {
      datastore: [
        {
          collection: 'notes',
          read: 'managed',
          write: 'managed',
          memory: 'stable'
        }
      ],
      storage: [
        {
          collection: 'images',
          read: 'managed',
          write: 'managed',
          memory: 'stable'
        }
      ]
    }
  }
});
