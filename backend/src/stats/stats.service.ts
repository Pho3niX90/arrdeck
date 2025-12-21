import {Injectable, Logger} from '@nestjs/common';
import {SonarrService} from '../integrations/sonarr/sonarr.service';
import {RadarrService} from '../integrations/radarr/radarr.service';
import {ServicesService} from '../services/services.service';
import {ServiceType} from '../services/service.entity';

@Injectable()
export class StatsService {
    private readonly logger = new Logger(StatsService.name);

    constructor(
        private sonarrService: SonarrService,
        private radarrService: RadarrService,
        private servicesService: ServicesService
    ) {
    }

    async getOverview() {
        const services = await this.servicesService.findAll();
        const sonarrs = services.filter(s => s.type === ServiceType.SONARR);
        const radarrs = services.filter(s => s.type === ServiceType.RADARR);

        const sonarrStats = await Promise.all(sonarrs.map(async s => {
            try {
                const [series, diskSpace, profiles] = await Promise.all([
                    this.sonarrService.getSeries(s.id),
                    this.sonarrService.getDiskSpace(s.id),
                    this.sonarrService.getProfiles(s.id)
                ]);

                const profileUsage = new Map<string, number>();
                series.forEach((s: any) => {
                    const profileName = profiles.find((p: any) => p.id === s.qualityProfileId)?.name || 'Unknown';
                    profileUsage.set(profileName, (profileUsage.get(profileName) || 0) + 1);
                });
                const profileStats = Array.from(profileUsage.entries()).map(([name, count]) => ({name, count}));

                return {
                    serviceId: s.id,
                    name: s.name,
                    seriesCount: series.length,
                    episodeCount: series.reduce((acc: number, curr: any) => acc + (curr.statistics?.episodeFileCount || 0), 0),
                    diskSpace: diskSpace,
                    profiles: profileStats
                };
            } catch (e) {
                this.logger.error(`Stats failed for Sonarr ${s.name}`, e);
                return null;
            }
        }));

        const radarrStats = await Promise.all(radarrs.map(async s => {
            try {
                const [movies, diskSpace, profiles] = await Promise.all([
                    this.radarrService.getMovies(s.id),
                    this.radarrService.getDiskSpace(s.id),
                    this.radarrService.getProfiles(s.id)
                ]);

                const profileUsage = new Map<string, number>();
                movies.forEach((m: any) => {
                    const profileName = profiles.find((p: any) => p.id === m.qualityProfileId)?.name || 'Unknown';
                    profileUsage.set(profileName, (profileUsage.get(profileName) || 0) + 1);
                });
                const profileStats = Array.from(profileUsage.entries()).map(([name, count]) => ({name, count}));

                return {
                    serviceId: s.id,
                    name: s.name,
                    movieCount: movies.length,
                    diskSpace: diskSpace,
                    profiles: profileStats
                };
            } catch (e) {
                this.logger.error(`Stats failed for Radarr ${s.name}`, e);
                return null;
            }
        }));

        return {
            sonarr: sonarrStats.filter(s => s !== null),
            radarr: radarrStats.filter(s => s !== null)
        };
    }
}
