import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DemandForecastService } from './demand-forecast.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [AiService, DemandForecastService],
  exports: [AiService],
})
export class AiModule {}
