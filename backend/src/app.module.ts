import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
<<<<<<< HEAD
import { WebsocketsModule } from './websockets/websockets.module';
import { OrdersModule } from './orders/orders.module';
=======
import { ComplaintsModule } from './complaints/complaints.module';
import { AnalyticsModule } from './analytics/analytics.module';
>>>>>>> 201a22a9919e01ac554d6d5e50bc43c80efe85b1

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AiModule,
    AuthModule,
    InventoryModule,
<<<<<<< HEAD
    WebsocketsModule,
    OrdersModule,
=======
    ComplaintsModule,
    AnalyticsModule,
>>>>>>> 201a22a9919e01ac554d6d5e50bc43c80efe85b1
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

