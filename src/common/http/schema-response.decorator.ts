import { applyDecorators, HttpStatus, SerializeOptions } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import type { StandardSchemaV1 } from '@standard-schema/spec';

/** Validates/strips the response through `schema` and documents it in Swagger. */
export const SchemaResponse = (
	schema: StandardSchemaV1,
	status: number = HttpStatus.OK,
) =>
	applyDecorators(
		SerializeOptions({ schema }),
		ApiResponse({ status, standardSchema: schema }),
	);
