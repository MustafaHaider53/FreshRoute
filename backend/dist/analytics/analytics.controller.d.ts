import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        wasteRate: {
            name: string;
            value: number;
        }[];
        forecastAccuracy: {
            category: string;
            predicted: number;
            confidence: string;
        }[] | {
            category: string;
            predicted: number;
            actual: number;
            accuracy: number;
        }[];
        topBuyers: {
            name: string;
            totalSpent: number;
        }[];
        driverSuccessRates: {
            name: string;
            successRate: number;
        }[];
    }>;
}
