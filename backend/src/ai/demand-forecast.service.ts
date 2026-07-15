import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class DemandForecastService {
  private readonly logger = new Logger(DemandForecastService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getForecast(category: string, currentWeek: number, currentYear: number) {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const whereClause: any = {
      order: {
        createdAt: { gte: eightWeeksAgo },
        status: { not: 'DISPUTED' }
      },
    };

    if (category && category !== 'all') {
      whereClause.product = { variety: category };
    }

    const orderItems = await this.db.orderItem.findMany({
      where: whereClause,
      include: {
        order: true,
      },
    });

    const weeklyData: Record<string, number> = {};
    let totalVolume4Weeks = 0;
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    orderItems.forEach(item => {
      const dateStr = item.order.createdAt.toISOString().split('T')[0];
      if (!weeklyData[dateStr]) weeklyData[dateStr] = 0;
      weeklyData[dateStr] += item.quantityOrdered;

      if (item.order.createdAt >= fourWeeksAgo) {
        totalVolume4Weeks += item.quantityOrdered;
      }
    });

    const prompt = `
      Historical order data for category '${category}' over the last 8 weeks:
      ${JSON.stringify(weeklyData)}

      Based on this data, predict the order volume for next week.
      Respond ONLY in JSON format like: { "predictedVolume": 100, "confidence": "medium" }
      Confidence can be "low", "medium", or "high".
    `;

    try {
      this.logger.log('Calling Groq AI for demand forecast...');
      const result = await this.aiService.getJsonCompletion<{ predictedVolume: number; confidence: string }>(
        prompt,
        'You are an expert agricultural supply chain analyst AI.'
      );

      return {
        category,
        predictedVolume: result.predictedVolume,
        confidence: result.confidence,
        weekOfYear: currentWeek + 1,
        year: currentYear,
        source: 'AI',
      };
    } catch (error) {
      this.logger.warn('AI unavailable, falling back to 4-week rolling average');
      const rollingAverage = totalVolume4Weeks / 4;
      return {
        category,
        predictedVolume: Math.round(rollingAverage),
        confidence: 'low',
        weekOfYear: currentWeek + 1,
        year: currentYear,
        source: 'FALLBACK_AVERAGE',
      };
    }
  }
}
