import {All, Body, Controller, Param, Query, Req, UseGuards} from '@nestjs/common';
import {ProxyService} from './proxy.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller({path: 'proxy', version: '1'})
export class ProxyController {
    constructor(private readonly proxyService: ProxyService) {
    }

    @All(':id/:path')
    async proxy(
        @Param('id') id: string,
        @Param('path') path: string,
        @Req() req: any,
        @Query() query: any,
        @Body() body: any,
    ) {
        return this.proxyService.proxyRequest(+id, path, req.method, body, query);
    }
}
