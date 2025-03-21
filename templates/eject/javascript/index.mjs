import {defineAssert, defineHook} from '@junobuild/functions';

// All the available hooks and assertions for your Datastore and Storage are scaffolded by default in this module.
// However, if you don’t have to implement all of them, for example to improve readability or reduce unnecessary logic,
// you can selectively delete the features you do not need.

export const assertSetDoc = defineAssert({
  collections: [],
  assert: (context) => {}
});

export const onSetDoc = defineHook({
  collections: [],
  run: async (context) => {}
});
