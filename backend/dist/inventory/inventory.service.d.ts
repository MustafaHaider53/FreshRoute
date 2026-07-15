import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateProductDto, UpdateProductDto, AcceptPriceDto } from './inventory.dto';
export declare class InventoryService {
    private prisma;
    private aiService;
    constructor(prisma: PrismaService, aiService: AiService);
    private calculateSpoilage;
    create(farmerId: string, dto: CreateProductDto): Promise<{
        daysSinceHarvest: number;
        spoilageRisk: "LOW" | "MEDIUM" | "HIGH";
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        variety: string;
        unit: string;
        price: number;
        quantity: number;
        harvestDate: Date;
        shelfLifeDays: number;
        farmerId: string;
    }>;
    getFarmerInventory(farmerId: string): Promise<{
        daysSinceHarvest: number;
        spoilageRisk: "LOW" | "MEDIUM" | "HIGH";
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        variety: string;
        unit: string;
        price: number;
        quantity: number;
        harvestDate: Date;
        shelfLifeDays: number;
        farmerId: string;
    }[]>;
    getAllProducts(): Promise<{
        daysSinceHarvest: number;
        spoilageRisk: "LOW" | "MEDIUM" | "HIGH";
        farmer: {
            name: string;
            email: string;
        };
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        variety: string;
        unit: string;
        price: number;
        quantity: number;
        harvestDate: Date;
        shelfLifeDays: number;
        farmerId: string;
    }[]>;
    update(productId: string, farmerId: string, dto: UpdateProductDto): Promise<{
        daysSinceHarvest: number;
        spoilageRisk: "LOW" | "MEDIUM" | "HIGH";
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        variety: string;
        unit: string;
        price: number;
        quantity: number;
        harvestDate: Date;
        shelfLifeDays: number;
        farmerId: string;
    }>;
    remove(productId: string, farmerId: string): Promise<{
        success: boolean;
    }>;
    getPricingSuggestion(productId: string, farmerId: string): Promise<{
        pricingSuggestionId: string;
        suggestedPrice: number;
        rationale: string;
        isFallback: boolean;
    }>;
    acceptPricingSuggestion(farmerId: string, dto: AcceptPriceDto): Promise<{
        suggestionAccepted: boolean;
        daysSinceHarvest: number;
        spoilageRisk: "LOW" | "MEDIUM" | "HIGH";
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        variety: string;
        unit: string;
        price: number;
        quantity: number;
        harvestDate: Date;
        shelfLifeDays: number;
        farmerId: string;
    }>;
}
