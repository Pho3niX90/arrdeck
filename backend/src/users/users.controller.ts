import {Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post} from '@nestjs/common';
import {UsersService} from './users.service';
import {User} from './user.entity';

@Controller({path: 'users', version: '1'})
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Post()
    create(@Body() user: Partial<User>) {
        return this.usersService.create(user);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() user: Partial<User>) {
        return this.usersService.update(id, user);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }
}
