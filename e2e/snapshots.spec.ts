import {testWithII} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {initTestSuite} from './utils/init.utils';

testWithII.describe.configure({mode: 'serial'});

const snapshotTests = ({satelliteKind}: {satelliteKind: 'website' | 'application'}) => {
  testWithII.describe(`satellite ${satelliteKind}`, () => {
    const getTestPages = initTestSuite({satelliteKind});

    const SNAPSHOT_TARGET = {target: 'satellite' as const};

    testWithII('should create and restore a snapshot', async () => {
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

    testWithII('should create, download, delete, upload and restore a snapshot', async () => {
      testWithII.setTimeout(120_000);

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

    testWithII(
      'should create, download, delete, upload and restore a snapshot to another satellite',
      async () => {
        testWithII.setTimeout(120_000);

        const {consolePage, cliPage} = getTestPages();

        await consolePage.getICP();

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
      }
    );
  });
};

snapshotTests({satelliteKind: 'application'});
snapshotTests({satelliteKind: 'website'});
