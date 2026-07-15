"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData() {
        const totalOrderItems = await this.prisma.orderItem.count();
        const wasteComplaints = await this.prisma.complaint.count({
            where: {
                resolutionType: {
                    in: ['REJECT', 'REPLACE'],
                },
            },
        });
        const wasteRate = totalOrderItems > 0 ? (wasteComplaints / totalOrderItems) * 100 : 0;
        const forecasts = await this.prisma.demandForecast.findMany();
        const forecastAccuracy = forecasts.map(f => ({
            category: f.category,
            predicted: f.predictedVolume,
            confidence: f.confidence,
        }));
        const finalForecastAccuracy = forecastAccuracy.length > 0 ? forecastAccuracy : [
            { category: 'Tomatoes', predicted: 1000, actual: 950, accuracy: 95 },
            { category: 'Apples', predicted: 500, actual: 400, accuracy: 80 },
        ];
        const topBuyersData = await this.prisma.order.groupBy({
            by: ['buyerId'],
            _sum: {
                totalAmount: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc',
                },
            },
            take: 5,
        });
        const topBuyers = await Promise.all(topBuyersData.map(async (tb) => {
            const user = await this.prisma.user.findUnique({ where: { id: tb.buyerId } });
            return {
                name: user?.name || 'Unknown',
                totalSpent: tb._sum.totalAmount || 0,
            };
        }));
        const driverStats = await this.prisma.order.groupBy({
            by: ['driverId', 'status'],
        });
        const driverMap = new Map();
        driverStats.forEach(stat => {
            if (!stat.driverId)
                return;
            const current = driverMap.get(stat.driverId) || { total: 0, delivered: 0 };
            current.total += 1;
            if (stat.status === 'DELIVERED') {
                current.delivered += 1;
            }
            driverMap.set(stat.driverId, current);
        });
        const driverSuccessRates = await Promise.all(Array.from(driverMap.entries()).map(async ([driverId, stats]) => {
            const user = await this.prisma.user.findUnique({ where: { id: driverId } });
            return {
                name: user?.name || 'Unknown',
                successRate: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0,
            };
        }));
        return {
            wasteRate: [
                { name: 'Waste', value: wasteRate },
                { name: 'Good', value: 100 - wasteRate }
            ],
            forecastAccuracy: finalForecastAccuracy,
            topBuyers,
            driverSuccessRates,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map