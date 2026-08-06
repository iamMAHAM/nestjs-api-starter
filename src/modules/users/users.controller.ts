import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import type { Auth } from '../../auth/auth.config.js';
import { ListUsersQueryDto, UpdateMeDto, UserDto } from './users.dto.js';
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
	@ApiOperation({ summary: 'List users (paginated)' })
	list(@Query() query: ListUsersQueryDto) {
		return this.users.list(query);
	}

	@Get('me')
	@ZodResponse({ type: UserDto })
	@ApiOperation({ summary: 'Current session user' })
	me(@Session() session: UserSession<Auth>) {
		return this.users.findById(session.user.id);
	}

	@Patch('me')
	@ZodResponse({ type: UserDto })
	@ApiOperation({ summary: 'Update the current user profile' })
	updateMe(@Session() session: UserSession<Auth>, @Body() body: UpdateMeDto) {
		return this.users.update(session.user.id, body);
	}

	@Get(':id')
	@ZodResponse({ type: UserDto })
	@ApiOperation({ summary: 'Fetch a user by id' })
	findOne(@Param('id') id: string) {
		return this.users.findById(id);
	}
}
