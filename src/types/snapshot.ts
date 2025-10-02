import * as z from 'zod';

const Uint8ArrayLike = z.instanceof(Uint8Array) as z.ZodType<Uint8Array<ArrayBufferLike>>;

// A Zod schema for the ic-management ReadCanisterSnapshotMetadataResponse type
const ReadCanisterSnapshotMetadataResponseSchema = z.strictObject({
  globals: z.array(
    z.union([
      z.object({f32: z.number()}),
      z.object({f64: z.number()}),
      z.object({i32: z.number()}),
      z.object({i64: z.bigint()}),
      z.object({v128: z.bigint()})
    ])
  ),
  canisterVersion: z.bigint(),
  source: z.union([
    z.object({metadataUpload: z.unknown()}),
    z.object({takenFromCanister: z.unknown()})
  ]),
  certifiedData: z.union([Uint8ArrayLike, z.array(z.number())]),
  globalTimer: z.union([z.object({active: z.bigint()}), z.object({inactive: z.null()})]).optional(),
  onLowWasmMemoryHookStatus: z
    .union([
      z.object({conditionNotSatisfied: z.null()}),
      z.object({executed: z.null()}),
      z.object({ready: z.null()})
    ])
    .optional(),
  wasmModuleSize: z.bigint(),
  stableMemorySize: z.bigint(),
  wasmChunkStore: z.array(
    z.object({
      hash: z.union([Uint8ArrayLike, z.array(z.number())])
    })
  ),
  takenAtTimestamp: z.bigint(),
  wasmMemorySize: z.bigint()
});

const SnapshotFilenameSchema = z.enum([
  'wasm-code.bin',
  'heap.bin',
  'stable.bin',
  'chunks-store.bin'
]);

const SnapshotFileSchema = z.strictObject({
  filename: SnapshotFilenameSchema,
  size: z.bigint(),
  hash: z.hash('sha256')
});

const SnapshotDataSchema = z.strictObject({
  wasmModule: SnapshotFileSchema.nullable(),
  wasmMemory: SnapshotFileSchema.nullable(),
  stableMemory: SnapshotFileSchema.nullable(),
  wasmChunkStore: SnapshotFileSchema.nullable()
});

export const SnapshotMetadataSchema = z.strictObject({
  snapshotId: z.string(),
  data: SnapshotDataSchema,
  metadata: ReadCanisterSnapshotMetadataResponseSchema
});

export type SnapshotFilename = z.infer<typeof SnapshotFilenameSchema>;
export type SnapshotFile = z.infer<typeof SnapshotFileSchema>;
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
export type ReadCanisterSnapshotMetadataResponse = z.infer<typeof ReadCanisterSnapshotMetadataResponseSchema>;
