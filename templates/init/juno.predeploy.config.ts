import {defineConfig} from '@junobuild/config';

export default defineConfig({
  satellite: {
    ids: {
      development: '<DEV_SATELLITE_ID>',
      production: '<PROD_SATELLITE_ID>'
    },
    source: '<SOURCE>',
    predeploy: ['<COMMAND> build']
  },
  orbiter: {
    id: '<ORBITER_ID>'
  }
});
