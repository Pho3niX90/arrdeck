import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

export enum ServiceType {
    SONARR = 'sonarr',
    RADARR = 'radarr',
    PROWLARR = 'prowlarr',
    DELUGE = 'deluge',
    JELLYSEER = 'jellyseer',
    TRAKT = 'trakt', // Trakt is external, might work differently (OAuth?), keeping it simple for now
    TVDB = 'tvdb',
    TMDB = 'tmdb',
    AI = 'ai',
    OTHER = 'other',
}

@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ServiceType,
        default: ServiceType.OTHER,
    })
    type: ServiceType;

    @Column()
    url: string;

    @Column({nullable: true})
    apiKey: string;

    @Column({nullable: true})
    model: string;
}
