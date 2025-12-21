import {Controller, Get} from '@nestjs/common';
import {StatsService} from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(private statsService: StatsService) {
    }

    @Get('overview')
    async getOverview() {
        return this.statsService.getOverview();
    }
}
