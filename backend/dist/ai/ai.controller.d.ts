import { DemandForecastService } from './demand-forecast.service';
export declare class AiController {
    private readonly demandForecastService;
    constructor(demandForecastService: DemandForecastService);
    getForecast(category: string, week: string, year: string): Promise<{
        category: string;
        predictedVolume: number;
        confidence: string;
        weekOfYear: number;
        year: number;
        source: string;
    }>;
}
