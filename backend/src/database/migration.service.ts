import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service to handle database migrations manually.
 * This mimics Flyway by reading SQL files from the migrations directory
 * and executing them tracking state in a schema_history table.
 */
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  private async runMigrations() {
    this.logger.log('Checking for pending migrations...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. Create schema_history table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS schema_history (
          installed_rank INT NOT NULL,
          version VARCHAR(50),
          description VARCHAR(200),
          type VARCHAR(20),
          script VARCHAR(1000) NOT NULL,
          checksum INT,
          installed_by VARCHAR(100) NOT NULL,
          installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          execution_time INT NOT NULL,
          success BOOLEAN NOT NULL,
          PRIMARY KEY (installed_rank)
        );
      `);

      // 2. Get executed migrations
      const executedMigrations = await queryRunner.query(
        'SELECT version FROM schema_history ORDER BY installed_rank DESC',
      );
      const executedVersions = new Set(
        executedMigrations.map((m: any) => m.version),
      );

      // 3. Scan migrations directory
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        this.logger.warn(
          `Migrations directory not found at ${migrationsDir}. Skipping migrations.`,
        );
        return;
      }

      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort((a, b) => {
          const vA = parseInt(a.match(/^V(\d+)__/)?.[1] || '0', 10);
          const vB = parseInt(b.match(/^V(\d+)__/)?.[1] || '0', 10);
          return vA - vB;
        });

      let rank = executedMigrations.length + 1;

      for (const file of files) {
        // Parse filename: V001__description.sql
        const match = file.match(/^V(\d+)__(.+)\.sql$/);
        if (!match) {
          this.logger.warn(`Skipping invalid migration filename: ${file}`);
          continue;
        }

        const version = match[1]; // "001"
        const description = match[2].replace(/_/g, ' ');

        if (executedVersions.has(version)) {
          continue; // Already executed
        }

        this.logger.log(`Executing migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        const startTime = Date.now();

        try {
          await queryRunner.startTransaction();
          await queryRunner.query(sql);

          const executionTime = Date.now() - startTime;

          // Record success
          await queryRunner.query(
            `INSERT INTO schema_history 
            (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
            VALUES ($1, $2, $3, 'SQL', $4, 0, 'system', $5, true)`,
            [rank, version, description, file, executionTime],
          );

          await queryRunner.commitTransaction();
          this.logger.log(`Successfully executed migration: ${file}`);
          rank++;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          this.logger.error(
            `Failed to execute migration ${file}: ${error.message}`,
          );
          // We stop on first failure
          throw error;
        }
      }

      this.logger.log('Migration process completed.');
    } catch (error) {
      this.logger.error('Migration failed', error);
      // We don't throw here to avoid crashing the app logic if transient,
      // but for migrations usually we WANT to crash if they fail.
      // Let's rethrow to prevent app startup if db is inconsistent.
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
