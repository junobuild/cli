import {Ed25519KeyIdentity} from '@dfinity/identity';
import {nonNullish} from '@dfinity/utils';
import type {PrincipalText} from '@dfinity/zod-schemas';
import {REDIRECT_URL} from '../constants/constants';
import {ENV} from '../env';
import {type JsonnableEd25519KeyIdentity} from '../types/identity';

export const generateToken = (): {principal: PrincipalText; token: JsonnableEd25519KeyIdentity} => {
  const key = Ed25519KeyIdentity.generate();
  const principal = key.getPrincipal().toText();
  const token = key.toJSON();

  return {principal, token};
};

export const authUrl = ({
  port,
  nonce,
  principal
}: {
  port: number;
  nonce: string;
  principal: string;
}): string => {
  const callbackUrl = authCallbackUrl({port, nonce});

  const authUrl = new URL(ENV.console.urls.auth);

  authUrl.searchParams.set('redirect_uri', encodeURIComponent(callbackUrl));
  authUrl.searchParams.set('principal', principal);

  if (nonNullish(ENV.profile)) {
    authUrl.searchParams.set('profile', encodeURIComponent(ENV.profile));
  }

  return authUrl.toString();
};

export const requestUrl = ({port, reqUrl}: {port: number; reqUrl: string | undefined}): string => {
  const requestUrl = REDIRECT_URL.replace('{port}', `${port}`);
  return `${requestUrl}${reqUrl}`;
};

const authCallbackUrl = ({port, nonce}: {port: number; nonce: string}): string => {
  const redirectUrl = new URL(REDIRECT_URL.replace('{port}', `${port}`));
  redirectUrl.searchParams.set('state', nonce);

  return redirectUrl.toString();
};
