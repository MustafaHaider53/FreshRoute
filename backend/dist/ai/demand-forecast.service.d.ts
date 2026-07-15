import { PrismaService } from '../database/prisma.service';
import { AiService } from './ai.service';
export declare class DemandForecastService {
    private readonly db;
    private readonly aiService;
    private readonly logger;
    constructor(db: PrismaService, aiService: AiService);
    getForecast(category: string, currentWeek: number, currentYear: number): Promise<{
        category: string;
        predictedVolume: number;
        confidence: string;
        weekOfYear: number;
        year: number;
        source: string;
    }>;
}
