import {transformFileSync} from '@babel/core';
import * as ts from "@babel/preset-typescript";
import * as mod from "@babel/plugin-transform-modules-commonjs";

/**
 * Source: Stencil
 * https://github.com/ionic-team/stencil/blob/main/src/compiler/sys/node-require.ts
 */
export const nodeRequire = (id: string) => {
  const results = {
    module: undefined as any,
    id,
  };

  try {
    const fs: typeof import('fs') = require('fs');
    const path: typeof import('path') = require('path');

    results.id = path.resolve(id);

    // ensure we cleared out node's internal require() cache for this file
    delete require.cache[results.id];

    // let's override node's require for a second
    // don't worry, we'll revert this when we're done
    require.extensions['.ts'] = (module: NodeJS.Module, fileName: string) => {
      let sourceText = fs.readFileSync(fileName, 'utf8');

      if (fileName.endsWith('.ts')) {
        // looks like we've got a typed config file
        // let's transpile it to .js quick
        sourceText = transformFileSync(fileName, {
          presets: [ts.default],
          plugins: [mod.default]
        }).code;

        console.log("------>", sourceText)
      } else {
        // quick hack to turn a modern es module
        // into and old school commonjs module
        sourceText = sourceText.replace(/export\s+\w+\s+(\w+)/gm, 'exports.$1');
      }


      try {
        // we need to coerce because of the requirements for the arguments to
        // this function. It's safe enough since it's already wrapped in a
        // `try { } catch`.
        (module as NodeModuleWithCompile)._compile(sourceText, fileName);
      } catch (e: any) {
        throw e;
      }
    };

    // let's do this!
    results.module = require(results.id);

    // all set, let's go ahead and reset the require back to the default
    require.extensions['.ts'] = undefined;
  } catch (e: any) {
    throw e;
  }

  return results;
};

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}