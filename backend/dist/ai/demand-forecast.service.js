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
var DemandForecastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandForecastService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const ai_service_1 = require("./ai.service");
let DemandForecastService = DemandForecastService_1 = class DemandForecastService {
    db;
    aiService;
    logger = new common_1.Logger(DemandForecastService_1.name);
    constructor(db, aiService) {
        this.db = db;
        this.aiService = aiService;
    }
    async getForecast(category, currentWeek, currentYear) {
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
        const whereClause = {
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
        const weeklyData = {};
        let totalVolume4Weeks = 0;
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        orderItems.forEach(item => {
            const dateStr = item.order.createdAt.toISOString().split('T')[0];
            if (!weeklyData[dateStr])
                weeklyData[dateStr] = 0;
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
            const result = await this.aiService.getJsonCompletion(prompt, 'You are an expert agricultural supply chain analyst AI.');
            return {
                category,
                predictedVolume: result.predictedVolume,
                confidence: result.confidence,
                weekOfYear: currentWeek + 1,
                year: currentYear,
                source: 'AI',
            };
        }
        catch (error) {
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
};
exports.DemandForecastService = DemandForecastService;
exports.DemandForecastService = DemandForecastService = DemandForecastService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], DemandForecastService);
//# sourceMappingURL=demand-forecast.service.js.map