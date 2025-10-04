import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import type {Page} from 'playwright-core';
import {testIds} from '../constants/test-ids.constants';
import {IdentityPage, type IdentityPageParams} from './identity.page';

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

  async goto(): Promise<void> {
    await this.page.goto('/');
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
    await expect(this.page.getByTestId(testIds.createSatellite.launch)).toBeVisible();

    await this.page.getByTestId(testIds.createSatellite.launch).click();

    await expect(this.page.getByTestId(testIds.createSatellite.create)).toBeVisible();

    await this.page.getByTestId(testIds.createSatellite.input).fill('Test');
    await this.page.getByTestId(testIds.createSatellite[kind]).click();

    await this.page.getByTestId(testIds.createSatellite.create).click();

    await expect(this.page.getByTestId(testIds.createSatellite.continue)).toBeVisible({
      timeout: 20000
    });

    await this.page.getByTestId(testIds.createSatellite.continue).click();
  }

  async visitSatellite({title}: {title: string} = {title: 'Juno / Satellite'}): Promise<Page> {
    await expect(this.page.getByTestId(testIds.satelliteOverview.visit)).toBeVisible();

    const satellitePagePromise = this.context.waitForEvent('page');

    await this.page.getByTestId(testIds.satelliteOverview.visit).click();

    const satellitePage = await satellitePagePromise;

    await expect(satellitePage).toHaveTitle(title);

    return satellitePage;
  }
}
