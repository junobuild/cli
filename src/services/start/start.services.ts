import {nonNullish} from '@dfinity/utils';
import {buildArgs} from '../../utils/build.utils';
import {watchBuild} from '../build/build.services';
import {startContainer} from './docker.services';

export const start = async (args?: string[]) => {
  const {watch, ...params} = buildArgs(args);

  if (nonNullish(watch) && watch !== false) {
    watchBuild({watch, ...params});
  }

  await startContainer();
};
