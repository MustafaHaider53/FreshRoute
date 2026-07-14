import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the PostgreSQL database via Prisma.');
    } catch (error) {
      console.error('Database connection failed. Please ensure PostgreSQL is running at localhost:5432 and credentials are correct.');
      console.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
