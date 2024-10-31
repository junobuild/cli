import {defineConfig} from '@junobuild/config';

export default defineConfig({
  satellite: {
    id: '<SATELLITE_ID>',
    source: '<SOURCE>',
    predeploy: ['<COMMAND> build']
  }
});
