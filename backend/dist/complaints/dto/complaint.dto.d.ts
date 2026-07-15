import { ResolutionType } from '@prisma/client';
export declare class CreateComplaintDto {
    orderItemId: string;
    buyerId: string;
    description: string;
    photoUrl?: string;
}
export declare class ResolveComplaintDto {
    resolutionType: ResolutionType;
}
