import {j} from '@junobuild/schema';

const CachedVersionSchema = j.strictObject({
  local: j.string(),
  remote: j.string().optional()
});

const CachedVersionsSchema = j.strictObject({
  lastCheck: j.date().optional(),
  cli: CachedVersionSchema.optional(),
  emulator: CachedVersionSchema.optional()
});

export type CachedVersions = j.infer<typeof CachedVersionsSchema>;
