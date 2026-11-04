import type { StandardSchemaV1 } from '@standard-schema/spec';

export class SchemaValidationException extends Error {
	constructor(readonly issues: readonly StandardSchemaV1.Issue[]) {
		super('Schema validation failed');
		this.name = 'SchemaValidationException';
	}
}
