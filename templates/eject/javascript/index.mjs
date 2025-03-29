import {defineAssert, defineHook} from '@junobuild/functions';

// All the available hooks and assertions for your Datastore and Storage are scaffolded by default in this module.
// However, if you don’t have to implement all of them, for example to improve readability or reduce unnecessary logic,
// you can selectively delete the features you do not need.

export const onSetDoc = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onSetManyDocs = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteDoc = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteManyDocs = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteFilteredDocs = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onUploadAsset = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteAsset = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteManyAssets = defineHook({
  collections: [],
  run: async (context) => {}
});

export const onDeleteFilteredAssets = defineHook({
  collections: [],
  run: async (context) => {}
});

export const assertSetDoc = defineAssert({
  collections: [],
  assert: (context) => {}
});

export const assertDeleteDoc = defineAssert({
  collections: [],
  assert: (context) => {}
});

export const assertUploadAsset = defineAssert({
  collections: [],
  assert: (context) => {}
});

export const assertDeleteAsset = defineAssert({
  collections: [],
  assert: (context) => {}
});
