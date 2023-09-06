import {green} from 'kleur';
import {login as consoleLogin} from '../services/console.services';
import {clearAuthConfig} from '../utils/auth.config.utils';

export const logout = async () => {
  clearAuthConfig();

  console.log(`${green('Logged out')}`);
};

export const login = async (args?: string[]) => {
  await consoleLogin(args);
};
