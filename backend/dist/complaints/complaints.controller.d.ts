import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, ResolveComplaintDto } from './dto/complaint.dto';
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    create(createComplaintDto: CreateComplaintDto): Promise<{
        manualRequired: boolean;
        id: string;
        createdAt: Date;
        buyerId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        updatedAt: Date;
        description: string;
        orderItemId: string;
        photoUrl: string | null;
        resolutionType: import("@prisma/client").$Enums.ResolutionType | null;
        defectCategory: string | null;
        severity: string | null;
        draftedSupplierAlert: string | null;
    }>;
    resolve(id: string, resolveComplaintDto: ResolveComplaintDto): Promise<{
        id: string;
        createdAt: Date;
        buyerId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        updatedAt: Date;
        description: string;
        orderItemId: string;
        photoUrl: string | null;
        resolutionType: import("@prisma/client").$Enums.ResolutionType | null;
        defectCategory: string | null;
        severity: string | null;
        draftedSupplierAlert: string | null;
    }>;
    getTraceback(orderItemId: string): Promise<{
        farmOrigin: string;
        harvestDate: Date;
        deliveryRunInfo: {
            driverName: string;
            deliveryAddress: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
        productDetails: {
            name: string;
            variety: string;
        };
    }>;
}
