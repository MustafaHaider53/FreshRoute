import { IsString, IsNumber, IsDateString, Min, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  variety: string;

  @IsString()
  unit: string; // e.g. "kg", "box"

  @IsNumber()
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Quantity cannot be negative' })
  quantity: number;

  @IsDateString({}, { message: 'Harvest date must be a valid ISO date string' })
  harvestDate: string;

  @IsNumber()
  @IsPositive({ message: 'Shelf life days must be a positive number' })
  shelfLifeDays: number;
}

export class UpdateProductDto {
  @IsNumber()
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Quantity cannot be negative' })
  quantity: number;
}

export class AcceptPriceDto {
  @IsString()
  pricingSuggestionId: string;
}
