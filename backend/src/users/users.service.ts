import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {
    }

    async onModuleInit() {
        const count = await this.usersRepository.count();
        if (count === 0) {
            this.logger.log('No users found. Creating default admin user.');
            const password = await bcrypt.hash('password', 10);
            await this.usersRepository.save({
                username: 'admin',
                password,
            });
            this.logger.log('Default user "admin" created.');
        }
    }

    async findOne(username: string): Promise<User | null> {
        return this.usersRepository.findOneBy({username});
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOneBy({id});
    }

    async create(user: Partial<User>): Promise<User> {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }
        const newUser = this.usersRepository.create(user);
        return this.usersRepository.save(newUser);
    }

    async update(id: number, updateUser: Partial<User>): Promise<User> {
        if (updateUser.password) {
            updateUser.password = await bcrypt.hash(updateUser.password, 10);
        }
        await this.usersRepository.update(id, updateUser);
        const updated = await this.usersRepository.findOneBy({id});
        if (!updated) throw new Error('User not found after update');
        return updated;
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
