import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, AcceptPriceDto } from './inventory.dto';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    create(req: any, dto: CreateProductDto): Promise<{
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
    getFarmerInventory(req: any): Promise<{
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
    update(id: string, req: any, dto: UpdateProductDto): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getPricingSuggestion(id: string, req: any): Promise<{
        pricingSuggestionId: string;
        suggestedPrice: number;
        rationale: string;
        isFallback: boolean;
    }>;
    acceptPrice(req: any, dto: AcceptPriceDto): Promise<{
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
