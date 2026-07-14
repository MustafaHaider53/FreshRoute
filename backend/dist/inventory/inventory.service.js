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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const ai_service_1 = require("../ai/ai.service");
let InventoryService = class InventoryService {
    prisma;
    aiService;
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
    }
    calculateSpoilage(harvestDate, shelfLifeDays) {
        const now = new Date();
        const harvest = new Date(harvestDate);
        const diffTime = now.getTime() - harvest.getTime();
        const daysSinceHarvest = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        let spoilageRisk = 'LOW';
        if (daysSinceHarvest >= shelfLifeDays) {
            spoilageRisk = 'HIGH';
        }
        else if (daysSinceHarvest >= shelfLifeDays * 0.5) {
            spoilageRisk = 'MEDIUM';
        }
        return { daysSinceHarvest, spoilageRisk };
    }
    async create(farmerId, dto) {
        const product = await this.prisma.product.create({
            data: {
                farmerId,
                name: dto.name,
                variety: dto.variety,
                unit: dto.unit,
                price: dto.price,
                quantity: dto.quantity,
                harvestDate: new Date(dto.harvestDate),
                shelfLifeDays: dto.shelfLifeDays,
            },
        });
        const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
        return {
            ...product,
            ...spoilage,
        };
    }
    async getFarmerInventory(farmerId) {
        const products = await this.prisma.product.findMany({
            where: { farmerId },
            orderBy: { createdAt: 'desc' },
        });
        return products.map(product => {
            const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
            return {
                ...product,
                ...spoilage,
            };
        });
    }
    async getAllProducts() {
        const products = await this.prisma.product.findMany({
            include: {
                farmer: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return products.map(product => {
            const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
            return {
                ...product,
                ...spoilage,
            };
        });
    }
    async update(productId, farmerId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.farmerId !== farmerId) {
            throw new common_1.ForbiddenException('You can only update your own products');
        }
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                price: dto.price,
                quantity: dto.quantity,
            },
        });
        const spoilage = this.calculateSpoilage(updated.harvestDate, updated.shelfLifeDays);
        return {
            ...updated,
            ...spoilage,
        };
    }
    async remove(productId, farmerId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.farmerId !== farmerId) {
            throw new common_1.ForbiddenException('You can only delete your own products');
        }
        await this.prisma.pricingSuggestion.deleteMany({
            where: { productId },
        });
        await this.prisma.product.delete({
            where: { id: productId },
        });
        return { success: true };
    }
    async getPricingSuggestion(productId, farmerId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.farmerId !== farmerId) {
            throw new common_1.ForbiddenException('You can only check pricing for your own products');
        }
        const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
        const systemPrompt = `You are a Dynamic Pricing Assistant for the FreshRoute farm-to-table supply chain platform.
Your task is to analyze agricultural listing details and suggest a fair, market-responsive price.
Consider the following criteria:
- High spoilage risk items (near shelf life expiry) should be discounted to clear stock quickly (e.g., 10-30% discount).
- High surplus stock (relative to typical orders) should have mild discounts.
- Freshly harvested, premium variety items can sustain higher margins.
You MUST output your recommendation strictly as a JSON object with this exact shape:
{
  "suggestedPrice": number,
  "rationale": string
}
Do not write any markdown code blocks or explanations outside this JSON.`;
        const prompt = `Produce Details:
Name: ${product.name}
Variety: ${product.variety}
Unit: ${product.unit}
Current Price: $${product.price} per ${product.unit}
Current Stock: ${product.quantity} ${product.unit}s
Days since harvest: ${spoilage.daysSinceHarvest} days
Total Shelf Life: ${product.shelfLifeDays} days
Spoilage Risk Level: ${spoilage.spoilageRisk}

Please generate the optimal price suggestion.`;
        try {
            const suggestion = await this.aiService.getJsonCompletion(prompt, systemPrompt);
            const dbSuggestion = await this.prisma.pricingSuggestion.create({
                data: {
                    productId,
                    suggestedPrice: suggestion.suggestedPrice,
                    originalPrice: product.price,
                    rationale: suggestion.rationale,
                    accepted: false,
                },
            });
            return {
                pricingSuggestionId: dbSuggestion.id,
                suggestedPrice: dbSuggestion.suggestedPrice,
                rationale: dbSuggestion.rationale,
                isFallback: false,
            };
        }
        catch (error) {
            console.warn('AI pricing failed. Gracefully degrading to historical fallback.', error);
            const rationale = `The AI pricing engine is temporarily offline. Showing your historical base price. Your historical range for ${product.name} is $${(product.price * 0.9).toFixed(2)} - $${(product.price * 1.1).toFixed(2)}.`;
            const dbSuggestion = await this.prisma.pricingSuggestion.create({
                data: {
                    productId,
                    suggestedPrice: product.price,
                    originalPrice: product.price,
                    rationale: rationale,
                    accepted: false,
                },
            });
            return {
                pricingSuggestionId: dbSuggestion.id,
                suggestedPrice: product.price,
                rationale,
                isFallback: true,
            };
        }
    }
    async acceptPricingSuggestion(farmerId, dto) {
        const suggestion = await this.prisma.pricingSuggestion.findUnique({
            where: { id: dto.pricingSuggestionId },
            include: { product: true },
        });
        if (!suggestion) {
            throw new common_1.NotFoundException('Pricing suggestion not found');
        }
        if (suggestion.product.farmerId !== farmerId) {
            throw new common_1.ForbiddenException('You can only accept pricing suggestions for your own products');
        }
        await this.prisma.pricingSuggestion.update({
            where: { id: dto.pricingSuggestionId },
            data: { accepted: true },
        });
        const updatedProduct = await this.prisma.product.update({
            where: { id: suggestion.productId },
            data: { price: suggestion.suggestedPrice },
        });
        const spoilage = this.calculateSpoilage(updatedProduct.harvestDate, updatedProduct.shelfLifeDays);
        return {
            ...updatedProduct,
            ...spoilage,
            suggestionAccepted: true,
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map