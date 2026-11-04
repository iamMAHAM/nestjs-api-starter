import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '../../auth/auth.config.js';
import { SchemaResponse } from '../../common/http/schema-response.decorator.js';
import {
	type ListUsersQuery,
	listUsersQuerySchema,
	publicUserPageSchema,
	publicUserSchema,
	type UpdateMe,
	updateMeSchema,
	userSchema,
} from './users.dto.js';
import { UsersService } from './users.service.js';

/**
 * Reference feature module: every route here is protected by the global
 * `AuthGuard` registered by `AuthModule` — add `@Public()` to opt a route out.
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
	constructor(private readonly users: UsersService) {}

	@Get()
	@SchemaResponse(publicUserPageSchema)
	@ApiOperation({ summary: 'List users (paginated)' })
	list(@Query({ schema: listUsersQuerySchema }) query: ListUsersQuery) {
		return this.users.list(query);
	}

	@Get('me')
	@SchemaResponse(userSchema)
	@ApiOperation({ summary: 'Current session user' })
	me(@Session() session: UserSession<Auth>) {
		return this.users.findSelf(session.user.id);
	}

	@Patch('me')
	@SchemaResponse(userSchema)
	@ApiOperation({ summary: 'Update the current user profile' })
	updateMe(
		@Session() session: UserSession<Auth>,
		@Body({ schema: updateMeSchema }) body: UpdateMe,
	) {
		return this.users.update(session.user.id, body);
	}

	@Get(':id')
	@SchemaResponse(publicUserSchema)
	@ApiOperation({ summary: 'Fetch a user by id' })
	findOne(@Param('id') id: string) {
		return this.users.findPublicById(id);
	}
}
