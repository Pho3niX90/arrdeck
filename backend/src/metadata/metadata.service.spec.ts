import { Test, TestingModule } from '@nestjs/testing';
import { MetadataService } from './metadata.service';
import { ServicesService } from '../services/services.service';
import { TmdbService } from '../integrations/tmdb/tmdb.service';
import { TraktService } from '../integrations/trakt/trakt.service';
import { Service } from '../services/service.entity';

describe('MetadataService', () => {
    let service: MetadataService;
    let servicesService: jest.Mocked<ServicesService>;
    let tmdbService: jest.Mocked<TmdbService>;
    let traktService: jest.Mocked<TraktService>;

    const mockTmdbServiceEntity = { id: 1, type: 'tmdb' } as Service;
    const mockTraktServiceEntity = { id: 2, type: 'trakt' } as Service;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetadataService,
                {
                    provide: ServicesService,
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: TmdbService,
                    useValue: {
                        getMovie: jest.fn(),
                        getTv: jest.fn(),
                    },
                },
                {
                    provide: TraktService,
                    useValue: {
                        getMovie: jest.fn(),
                        getShow: jest.fn(),
                        getShowSeasons: jest.fn(),
                        search: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<MetadataService>(MetadataService);
        servicesService = module.get(ServicesService);
        tmdbService = module.get(TmdbService);
        traktService = module.get(TraktService);

        servicesService.findAll.mockResolvedValue([mockTmdbServiceEntity, mockTraktServiceEntity]);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('resolveAndFetch', () => {
        it('should prioritize TMDB if TMDB ID and service are available (Movie)', async () => {
            const tmdbData = {
                title: 'Test Movie',
                release_date: '2023-01-01',
                overview: 'Overview',
                vote_average: 8.5,
                id: 123,
            };
            tmdbService.getMovie.mockResolvedValue(tmdbData);

            const result = await service.resolveAndFetch({ tmdb: 123 }, 'movie');

            expect(tmdbService.getMovie).toHaveBeenCalledWith(1, 123);
            expect(result.title).toBe('Test Movie');
            expect(result.ids.tmdb).toBe(123);
        });

        it('should fallback to Trakt if TMDB fails or ID missing (Movie)', async () => {
            const traktData = {
                title: 'Trakt Movie',
                year: 2023,
                overview: 'Trakt Overview',
                rating: 8.0,
                ids: { trakt: 456, tmdb: null }, // No TMDB ID
            };
            traktService.getMovie.mockResolvedValue(traktData);

            // simulate no TMDB ID passed
            const result = await service.resolveAndFetch({ trakt: 456 }, 'movie');

            expect(tmdbService.getMovie).not.toHaveBeenCalled();
            expect(traktService.getMovie).toHaveBeenCalledWith(2, 456);
            expect(result.title).toBe('Trakt Movie');
        });

        it('should upgrade to TMDB from Trakt result if TMDB ID exists (Movie)', async () => {
            const traktData = {
                title: 'Trakt Movie',
                ids: { trakt: 456, tmdb: 999 }, // Has TMDB ID
            };
            const tmdbData = {
                title: 'TMDB Upgraded Movie',
                release_date: '2023-01-01',
                id: 999,
            };

            traktService.getMovie.mockResolvedValue(traktData);
            tmdbService.getMovie.mockResolvedValue(tmdbData);

            const result = await service.resolveAndFetch({ trakt: 456 }, 'movie');

            expect(traktService.getMovie).toHaveBeenCalledWith(2, 456);
            expect(tmdbService.getMovie).toHaveBeenCalledWith(1, 999); // Upgraded fetch
            expect(result.title).toBe('TMDB Upgraded Movie');
        });

        it('should resolve via search if only external IDs match (TV)', async () => {
            const searchResult = {
                show: {
                    ids: { trakt: 789, tmdb: 555 },
                },
            };
            // Mock search
            traktService.search.mockResolvedValue([searchResult]);

            const tmdbData = {
                name: 'Searched Show',
                first_air_date: '2020-01-01',
                id: 555,
            };
            tmdbService.getTv.mockResolvedValue(tmdbData);

            const result = await service.resolveAndFetch({ tvdb: 111 }, 'show');

            expect(traktService.search).toHaveBeenCalledWith(2, 'tvdb', '111', 'show');
            expect(tmdbService.getTv).toHaveBeenCalledWith(1, 555);
            expect(result.title).toBe('Searched Show');
        });
    });
});
