import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ResolutionType } from '@prisma/client';

export class CreateComplaintDto {
  @IsString()
  orderItemId: string;

  @IsString()
  buyerId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class ResolveComplaintDto {
  @IsEnum(ResolutionType)
  resolutionType: ResolutionType;
}
