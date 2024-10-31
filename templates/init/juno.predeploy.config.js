import {defineConfig} from '@junobuild/config';

/** @type {import('@junobuild/config').JunoConfig} */
export default defineConfig({
  satellite: {
    id: '<SATELLITE_ID>',
    source: '<SOURCE>',
    predeploy: ['<COMMAND> build']
  },
  orbiter: {
    id: '<ORBITER_ID>'
  }
});
