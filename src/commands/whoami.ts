import {Ed25519KeyIdentity} from '@dfinity/identity';
import {green} from 'kleur';
import {getToken} from '../utils/auth.config.utils';

export const whoami = () => {
  const token = getToken();

  if (!token) {
    console.log(`No controller found.`);
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`${green(identity.getPrincipal().toText())}`);
};
