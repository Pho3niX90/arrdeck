import {Client} from 'pg';
import {Logger} from '@nestjs/common';

export async function ensureDatabaseExists() {
    const logger = new Logger('DatabaseInit');
    const dbConfig = {
        user: process.env.DB_USERNAME || 'arrdeck',
        password: process.env.DB_PASSWORD || 'arrdeck',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: 'postgres', // Connect to default 'postgres' db to check/create target db
    };

    const targetDatabase = process.env.DB_DATABASE || 'arrdeck';

    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(
            `SELECT 1
             FROM pg_database
             WHERE datname = $1`,
            [targetDatabase],
        );

        if (res.rowCount === 0) {
            logger.log(`Database '${targetDatabase}' does not exist. Creating...`);
            // Cannot execute CREATE DATABASE in a transaction block, so we run it directly
            await client.query(`CREATE DATABASE "${targetDatabase}"`);
            logger.log(`Database '${targetDatabase}' created successfully.`);
        } else {
            logger.log(`Database '${targetDatabase}' already exists.`);
        }
    } catch (error) {
        logger.error(`Failed to check or create database: ${error.message}`, error.stack);
        // We might want to throw here to stop startup, or let TypeORM fail later
        throw error;
    } finally {
        await client.end();
    }
}
