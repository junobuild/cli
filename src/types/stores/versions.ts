import {j} from '@junobuild/schema';

export const CachedVersionSchema = j.strictObject({
  lastCheck: j.iso.datetime(),
  local: j.string().optional(),
  remote: j.string().optional()
});

export const CachedVersionsSchema = j.strictObject({
  weeklyCheckEnabled: j.boolean().optional(),
  cli: CachedVersionSchema.optional(),
  emulator: CachedVersionSchema.optional()
});

export type CachedVersion = j.infer<typeof CachedVersionSchema>;
export type CachedVersions = j.infer<typeof CachedVersionsSchema>;
