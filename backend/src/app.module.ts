import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { OrdersModule } from './orders/orders.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AiModule,
    AuthModule,
    InventoryModule,
    WebsocketsModule,
    OrdersModule,
    ComplaintsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

