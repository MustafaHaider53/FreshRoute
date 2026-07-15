import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { ComplaintsGateway } from './complaints.gateway';
import { CreateComplaintDto, ResolveComplaintDto } from './dto/complaint.dto';
export declare class ComplaintsService {
    private readonly prisma;
    private readonly aiService;
    private readonly gateway;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService, gateway: ComplaintsGateway);
    createComplaint(dto: CreateComplaintDto): Promise<{
        manualRequired: boolean;
        id: string;
        buyerId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        orderItemId: string;
        photoUrl: string | null;
        resolutionType: import("@prisma/client").$Enums.ResolutionType | null;
        defectCategory: string | null;
        severity: string | null;
        draftedSupplierAlert: string | null;
    }>;
    resolveComplaint(id: string, dto: ResolveComplaintDto): Promise<{
        id: string;
        buyerId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        createdAt: Date;
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
