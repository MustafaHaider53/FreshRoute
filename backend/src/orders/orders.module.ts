import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [DatabaseModule, WebsocketsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
