// Re-export the generated zod schemas only.
// Plain TypeScript interfaces in `./generated/types` collide with the zod
// schema names (TS treats them as the same export name even across value/type
// namespaces). Consumers that need the inferred type for a schema should use
// `z.infer<typeof SchemaName>` rather than the duplicated `interface`.
export * from "./generated/api";
