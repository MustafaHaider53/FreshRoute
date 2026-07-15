import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeliveryService } from './delivery.service';

@Injectable()
export class DeliveryCronService {
  private readonly logger = new Logger(DeliveryCronService.name);

  constructor(private readonly deliveryService: DeliveryService) {}

  @Cron('0 0 6 * * *', {
    name: 'daily-delivery-schedule',
    timeZone: process.env.DELIVERY_CRON_TIME_ZONE || 'Asia/Karachi',
  })
  async createDailyScheduleReports() {
    const reports = await this.deliveryService.generateDailyScheduleReports();
    if (reports.length === 0) {
      this.logger.log(
        'Daily delivery schedule: no driver stops scheduled today.',
      );
      return;
    }
    reports.forEach((report) => this.logger.log(report.summary));
  }
}
