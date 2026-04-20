import {initEmulatorSuite} from '@junobuild/emulator-playwright';
import {expect, test} from '@playwright/test';

const DEV = (process.env.NODE_ENV ?? 'production') === 'development';
const COMMAND = DEV ? {command: 'node', args: ['dist/index.js']} : {command: 'juno', args: []};

test.describe.configure({mode: 'serial'});

const snapshotTests = ({satelliteKind}: {satelliteKind: 'website' | 'application'}) => {
  test.describe(`satellite ${satelliteKind}`, () => {
    const getTestPages = initEmulatorSuite({satelliteKind, cli: {command: COMMAND}});

    const SNAPSHOT_TARGET = {target: 'satellite' as const};

    test('should create and restore a snapshot', async () => {
      const {consolePage, cliPage} = getTestPages();

      await cliPage.createSnapshot(SNAPSHOT_TARGET);

      await cliPage.clearHosting();

      const satellitePage = await consolePage.visitSatelliteSite({
        title: 'Response Verification Error - 503 | Internet Computer'
      });
      await satellitePage.assertScreenshot();

      await cliPage.restoreSnapshot(SNAPSHOT_TARGET);

      await satellitePage.reload();
      await satellitePage.assertScreenshot();
    });

    test('should create, download, delete, upload and restore a snapshot', async () => {
      test.setTimeout(120_000);

      const {consolePage, cliPage} = getTestPages();

      await cliPage.createSnapshot(SNAPSHOT_TARGET);

      const {snapshotFolder} = await cliPage.downloadSnapshot(SNAPSHOT_TARGET);

      await cliPage.deleteSnapshot(SNAPSHOT_TARGET);

      const {snapshotId} = await cliPage.listSnapshot(SNAPSHOT_TARGET);
      expect(snapshotId).toBeUndefined();

      await cliPage.clearHosting();

      const satellitePage = await consolePage.visitSatelliteSite({
        title: 'Response Verification Error - 503 | Internet Computer'
      });
      await satellitePage.assertScreenshot();

      await cliPage.uploadSnapshot({...SNAPSHOT_TARGET, folder: snapshotFolder});

      await cliPage.restoreSnapshot(SNAPSHOT_TARGET);

      await satellitePage.reload();
      await satellitePage.assertScreenshot();
    });

    test('should create, download, delete, upload and restore a snapshot to another satellite', async () => {
      test.setTimeout(120_000);

      const {consolePage, cliPage} = getTestPages();

      await consolePage.getCycles();

      await consolePage.goto();

      await consolePage.openCreateAdditionalSatelliteWizard({kind: 'application'});

      const satelliteId = await consolePage.copySatelliteID();

      await cliPage.toggleSatelliteId({satelliteId});

      const {accessKey} = await cliPage.whoami();

      await consolePage.addSatelliteAdminAccessKey({accessKey, satelliteId});

      await cliPage.deployHosting({clear: true});

      await consolePage.goto({path: `/satellite/?s=${satelliteId}`});

      const satellitePage = await consolePage.visitSatelliteSite({
        title: 'Hello World'
      });
      await satellitePage.assertScreenshot();

      const {snapshotFolder} = await cliPage.getSnapshotFsFolder();

      await cliPage.uploadSnapshot({...SNAPSHOT_TARGET, folder: snapshotFolder});

      await cliPage.restoreSnapshot(SNAPSHOT_TARGET);

      await satellitePage.reload();
      await satellitePage.assertScreenshot();
    });
  });
};

snapshotTests({satelliteKind: 'application'});
snapshotTests({satelliteKind: 'website'});
