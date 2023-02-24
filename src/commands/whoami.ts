import {Ed25519KeyIdentity} from '@dfinity/identity';
import {green} from 'kleur';
import {getToken, getUse, isDefaultProfile} from '../utils/auth.config.utils';

export const whoami = () => {
  const profile = getUse();

  if (!isDefaultProfile(profile)) {
    console.log(`Profile: ${green(profile!)}`);
  }

  const token = getToken();

  if (!token) {
    console.log(`No controller found.`);
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`Controller: ${green(identity.getPrincipal().toText())}`);
};
