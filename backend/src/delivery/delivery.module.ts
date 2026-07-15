import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeliveryController } from './delivery.controller';
import { DeliveryCronService } from './delivery-cron.service';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [AuthModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway, DeliveryCronService],
  exports: [DeliveryService, DeliveryGateway],
})
export class DeliveryModule {}
