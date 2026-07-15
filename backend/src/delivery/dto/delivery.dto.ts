import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeliveryStopStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryStopCoordinateDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 24.8607 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 67.0011 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number;
}

export class AssignDeliveryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  driverId: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  orderIds: string[];

  @ApiProperty({ example: '2026-07-16T09:00:00.000Z' })
  @IsDateString()
  scheduledDeliveryDate: string;

  @ApiPropertyOptional({ type: [DeliveryStopCoordinateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryStopCoordinateDto)
  stops?: DeliveryStopCoordinateDto[];
}

export class UpdateStopStatusDto {
  @ApiProperty({
    enum: [DeliveryStopStatus.DELIVERED, DeliveryStopStatus.FAILED],
  })
  @IsEnum(DeliveryStopStatus)
  status: DeliveryStopStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}

export class OptimizeRouteDto {
  @ApiPropertyOptional({
    example:
      'Deliver the Clifton stop before noon and keep frozen items first.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  constraints?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  orderIds?: string[];
}

export class AcceptRouteOrderDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  orderedOrderIds: string[];
}

export class GenerateScheduleReportDto {
  @ApiPropertyOptional({ example: '2026-07-16' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
