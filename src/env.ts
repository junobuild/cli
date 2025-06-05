import {loadEnv} from './cli/env.loader';

export const ENV = loadEnv();

export const DEV = ENV.mode === 'development';
