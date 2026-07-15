import { PrismaService } from '../database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardData(): Promise<{
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
