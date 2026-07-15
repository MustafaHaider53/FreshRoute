import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsGateway } from './complaints.gateway';

@Module({
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintsGateway],
})
export class ComplaintsModule {}
