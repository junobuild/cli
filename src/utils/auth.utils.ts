import {REDIRECT_URL} from '../constants/constants';
import {ENV} from '../env';

export const authUrl = ({
  port,
  nonce,
  principal
}: {
  port: number;
  nonce: number;
  principal: string;
}): string => {
  const callbackUrl = authCallbackUrl({port, nonce});

  const authUrl = new URL(ENV.authUrl);
  authUrl.searchParams.set('redirect_uri', encodeURIComponent(callbackUrl));
  authUrl.searchParams.set('principal', principal);

  return authUrl.toString();
};

export const requestUrl = ({port, reqUrl}: {port: number; reqUrl: string | undefined}): string => {
  const requestUrl = REDIRECT_URL.replace('{port}', `${port}`);
  return `${requestUrl}${reqUrl}`;
};

export const authCallbackUrl = ({port, nonce}: {port: number; nonce: number}): string => {
  const redirectUrl = new URL(REDIRECT_URL.replace('{port}', `${port}`));
  redirectUrl.searchParams.set('state', `${nonce}`);

  return redirectUrl.toString();
};
