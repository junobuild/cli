import {transformFileSync} from '@babel/core';
import * as mod from '@babel/plugin-transform-modules-commonjs';
import * as ts from '@babel/preset-typescript';
import * as tst from "@junobuild/types";
import {readFileSync} from 'node:fs';

/**
 * Adapted source from Stencil (https://github.com/ionic-team/stencil/blob/main/src/compiler/sys/node-require.ts)
 */
export const nodeRequire = <T>(id: string): {default: T} => {
  // ensure we cleared out node's internal require() cache for this file
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete require.cache[id];

  try {
    // let's override node's require for a second
    // don't worry, we'll revert this when we're done
    // eslint-disable-next-line n/no-deprecated-api
    require.extensions['.ts'] = (module: NodeJS.Module, fileName: string) => {
      let sourceText = readFileSync(fileName, 'utf8');

      if (fileName.endsWith('.ts')) {
        // looks like we've got a typed config file
        // let's transpile it to .js quick
        sourceText = transformFileSync(fileName, {
          presets: [ts.default],
          plugins: [mod.default]
        }).code;

        console.log(sourceText)

      } else {
        // quick hack to turn a modern es module
        // into and old school commonjs module
        sourceText = sourceText.replace(/export\s+\w+\s+(\w+)/gm, 'exports.$1');
      }

      interface NodeModuleWithCompile extends NodeModule {
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        _compile(code: string, filename: string): T;
      }

      // we need to coerce because of the requirements for the arguments to
      // this function.
      (module as NodeModuleWithCompile)._compile(sourceText, fileName);
    };

    // let's do this!
    return require(id);
  } finally {
    // all set, let's go ahead and reset the require back to the default
    // eslint-disable-next-line n/no-deprecated-api
    require.extensions['.ts'] = undefined;
  }
};
