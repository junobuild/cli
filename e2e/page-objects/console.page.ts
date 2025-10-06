import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {notEmptyString} from '@dfinity/utils';
import {PrincipalText, PrincipalTextSchema} from '@dfinity/zod-schemas';
import {expect} from '@playwright/test';
import {testIds} from '../constants/test-ids.constants';
import {IdentityPage, type IdentityPageParams} from './identity.page';
import {SatellitePage} from './satellite.page';

export class ConsolePage extends IdentityPage {
  readonly #consoleIIPage: InternetIdentityPage;

  private constructor(params: IdentityPageParams) {
    super(params);

    this.#consoleIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });
  }

  static async initWithSignIn(params: IdentityPageParams): Promise<ConsolePage> {
    const consolePage = new ConsolePage(params);

    await consolePage.waitReady();

    await consolePage.goto();

    await consolePage.signIn();

    return consolePage;
  }

  async goto({path}: {path: string} = {path: '/'}): Promise<void> {
    await this.page.goto(path);
  }

  async signIn(): Promise<void> {
    this.identity = await this.#consoleIIPage.signInWithNewIdentity({
      selector: `[data-tid=${testIds.auth.signIn}]`
    });
  }

  async waitReady(): Promise<void> {
    const CONTAINER_URL = 'http://127.0.0.1:5987';
    const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

    await this.#consoleIIPage.waitReady({url: CONTAINER_URL, canisterId: INTERNET_IDENTITY_ID});
  }

  async createSatellite({kind}: {kind: 'website' | 'application'}): Promise<void> {
    await expect(this.page.getByTestId(testIds.createSatellite.launch)).toBeVisible({
      timeout: 20000
    });

    await this.page.getByTestId(testIds.createSatellite.launch).click();

    await expect(this.page.getByTestId(testIds.createSatellite.create)).toBeVisible({
      timeout: 15000
    });

    await this.page.getByTestId(testIds.createSatellite.input).fill('Test');
    await this.page.getByTestId(testIds.createSatellite[kind]).click();

    await this.page.getByTestId(testIds.createSatellite.create).click();

    await expect(this.page.getByTestId(testIds.createSatellite.continue)).toBeVisible({
      timeout: 20000
    });

    await this.page.getByTestId(testIds.createSatellite.continue).click();
  }

  async visitSatelliteSite(
    {title}: {title: string} = {title: 'Juno / Satellite'}
  ): Promise<SatellitePage> {
    await expect(this.page.getByTestId(testIds.satelliteOverview.visit)).toBeVisible({
      timeout: 20000
    });

    const satellitePagePromise = this.context.waitForEvent('page');

    await this.page.getByTestId(testIds.satelliteOverview.visit).click();

    const satellitePage = await satellitePagePromise;

    await expect(satellitePage).toHaveTitle(title);

    return new SatellitePage({
      page: satellitePage,
      browser: this.browser,
      context: this.context
    });
  }

  async getICP(): Promise<void> {
    await expect(this.page.getByTestId(testIds.navbar.openWallet)).toBeVisible();

    await this.page.getByTestId(testIds.navbar.openWallet).click();

    await expect(this.page.getByTestId(testIds.navbar.getIcp)).toBeVisible();

    await this.page.getByTestId(testIds.navbar.getIcp).click();

    await expect(this.page.getByText('55.0001')).toBeVisible({timeout: 65000});
  }

  async copySatelliteID(): Promise<string> {
    await expect(this.page.getByTestId(testIds.satelliteOverview.copySatelliteId)).toBeVisible();

    await this.page.getByTestId(testIds.satelliteOverview.copySatelliteId).click();

    const satelliteId = await this.page.evaluate(() => navigator.clipboard.readText());

    expect(notEmptyString(satelliteId)).toBeTruthy();
    expect(PrincipalTextSchema.safeParse(satelliteId).success).toBeTruthy();

    return satelliteId;
  }

  async addSatelliteAdminAccessKey({
    satelliteId,
    accessKey
  }: {
    satelliteId: PrincipalText;
    accessKey: string;
  }): Promise<void> {
    await this.goto({path: `/satellite/?s=${satelliteId}&tab=setup`});

    const btnLocator = this.page.locator('button', {hasText: 'Add an access key'});
    await expect(btnLocator).toBeVisible({timeout: 10000});
    await btnLocator.click();

    const form = this.page.locator('form');

    await form.getByRole('radio', {name: /enter one manually/i}).check();

    const keyField = form.getByLabel('Access Key ID');
    await expect(keyField).toBeEnabled();
    await keyField.fill(accessKey);

    await form.locator('select[name="scope"]').selectOption('admin');

    const submitLocator = form.getByRole('button', {name: /^submit$/i});
    await expect(submitLocator).toBeEnabled();
    await submitLocator.click();

    await expect(this.page.getByText('Access Key Added')).toBeVisible({timeout: 10000});
  }
}
