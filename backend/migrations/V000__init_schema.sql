-- Initial Schema Migration

-- Create Service Type Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type_enum') THEN
        CREATE TYPE service_type_enum AS ENUM (
            'sonarr',
            'radarr',
            'prowlarr',
            'deluge',
            'jellyseer',
            'jellyfin',
            'trakt',
            'tvdb',
            'tmdb',
            'ai',
            'other'
        );
    END IF;
END$$;

-- Create User Table
CREATE TABLE IF NOT EXISTS "user" (
    "id" SERIAL NOT NULL,
    "username" character varying NOT NULL,
    "password" character varying NOT NULL,
    CONSTRAINT "UQ_user_username" UNIQUE ("username"),
    CONSTRAINT "PK_user" PRIMARY KEY ("id")
);

-- Create Service Table
CREATE TABLE IF NOT EXISTS "service" (
    "id" SERIAL NOT NULL,
    "name" character varying NOT NULL,
    "type" "service_type_enum" NOT NULL DEFAULT 'other',
    "url" character varying NOT NULL,
    "apiKey" character varying,
    "model" character varying,
    CONSTRAINT "PK_service" PRIMARY KEY ("id")
);
