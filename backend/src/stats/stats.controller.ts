import {Controller, Get, UseGuards} from '@nestjs/common';
import {StatsService} from './stats.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
    constructor(private statsService: StatsService) {
    }

    @Get('overview')
    async getOverview() {
        return this.statsService.getOverview();
    }
}
