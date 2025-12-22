-- Add 'jellyfin' to the service_type_enum if it doesn't exist
ALTER TYPE service_type_enum ADD VALUE IF NOT EXISTS 'jellyfin';
