import {green} from 'kleur';
import {clearAuthConfig} from '../configs/auth.config';
import {login as consoleLogin} from '../services/console.services';

export const logout = async () => {
  clearAuthConfig();

  console.log(`${green('Logged out')}`);
};

export const login = async (args?: string[]) => {
  await consoleLogin(args);
};
