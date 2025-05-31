import {
  deploy as cliDeploy,
  deployWithProposal as cliDeployWithProposal,
  type DeployResult,
  type DeployResultWithProposal,
  hasArgs
} from '@junobuild/cli-tools';
import {junoConfigExist} from '../configs/juno.config';
import {clear} from '../services/clear.services';
import {type DeployFnParams, executeDeploy} from '../services/deploy/deploy.execute.services';
import {links} from '../services/links.services';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const clearOption = hasArgs({args, options: ['-c', '--clear']});
  const immediate = hasArgs({args, options: ['-i', '--immediate']});

  if (immediate) {
    await deployImmediate({args, clearOption});
    return;
  }

  await deployWithProposal({args, clearOption});
};

const deployWithProposal = async ({args, clearOption}: {args?: string[]; clearOption: boolean}) => {
  const noCommit = hasArgs({args, options: ['-n', '--no-commit']});

  const deployFn = async ({deploy, satellite}: DeployFnParams): Promise<DeployResultWithProposal> =>
    await cliDeployWithProposal({
      deploy,
      proposal: {
        clearAssets: clearOption,
        autoCommit: !noCommit,
        cdn: {
          satellite
        }
      }
    });

  const {result} = await executeDeploy({
    args,
    deployFn
  });

  if (result !== 'deployed') {
    return;
  }

  await links(args);
};

const deployImmediate = async ({args, clearOption}: {args?: string[]; clearOption: boolean}) => {
  if (clearOption) {
    await clear(args);
  }

  const deployFn = async ({deploy}: DeployFnParams): Promise<DeployResult> =>
    await cliDeploy(deploy);

  await executeDeploy({
    args,
    deployFn
  });

  await links(args);
};
