import {deploy as cliDeploy, deployWithProposal as cliDeployWithProposal, type DeployParams, type DeployResult, hasArgs} from '@junobuild/cli-tools';
import {junoConfigExist} from '../configs/juno.config';
import {clear} from '../services/clear.services';
import {executeDeploy} from '../services/deploy/deploy.execute.services';
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

  const cliDeploy = (params: DeployParams): Promise<DeployResult> => {
      await cliDeployWithProposal({
        deploy: params,
        proposal: {
          clearAssets: clearOption,
          autoCommit: !noCommit,
          cdn
        }
      })
  }

  await executeDeploy({
    args,
    deployFn: cliDeploy
  });

  await links(args);
};

const deployImmediate = async ({args, clearOption}: {args?: string[]; clearOption: boolean}) => {
  if (clearOption) {
    await clear(args);
  }

  await executeDeploy({
    args,
    deployFn: cliDeploy
  });

  await links(args);
};
