export declare class CreateProductDto {
    name: string;
    variety: string;
    unit: string;
    price: number;
    quantity: number;
    harvestDate: string;
    shelfLifeDays: number;
}
export declare class UpdateProductDto {
    price: number;
    quantity: number;
}
export declare class AcceptPriceDto {
    pricingSuggestionId: string;
}
