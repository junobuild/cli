import {j} from '@junobuild/schema';

const CachedVersionSchema = j.strictObject({
  lastCheck: j.iso.datetime(),
  local: j.string().optional(),
  remote: j.string().optional()
});

const CachedVersionsSchema = j.strictObject({
  cli: CachedVersionSchema.optional(),
  emulator: CachedVersionSchema.optional()
});

export type CachedVersion = j.infer<typeof CachedVersionSchema>;
export type CachedVersions = j.infer<typeof CachedVersionsSchema>;
