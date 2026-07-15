import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { ComplaintsGateway } from './complaints.gateway';
import { CreateComplaintDto, ResolveComplaintDto } from './dto/complaint.dto';

interface AiClassification {
  defectCategory: string;
  severity: string;
  draftedSupplierAlert: string;
}

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly gateway: ComplaintsGateway,
  ) {}

  async createComplaint(dto: CreateComplaintDto) {
    let classification: AiClassification | null = null;
    let defectCategory = 'UNCLASSIFIED';
    let severity = 'UNKNOWN';
    let draftedSupplierAlert: string | null = null;
    let manualRequired = false;

    try {
      const prompt = `Classify this fresh produce complaint. Return JSON with 'defectCategory' (e.g., FRESHNESS, PACKAGING, CONTAMINATION, OTHER), 'severity' (MINOR, MAJOR, CRITICAL), and 'draftedSupplierAlert' (a short warning message to the supplier). Complaint: "${dto.description}"`;
      classification = await this.aiService.getJsonCompletion<AiClassification>(prompt);
      
      defectCategory = classification.defectCategory || 'UNCLASSIFIED';
      severity = classification.severity || 'UNKNOWN';
      draftedSupplierAlert = classification.draftedSupplierAlert || null;
    } catch (error) {
      this.logger.error('Failed to classify complaint via AI. Fallback to manual.', error);
      manualRequired = true;
      defectCategory = 'MANUAL_REQUIRED';
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        orderItemId: dto.orderItemId,
        buyerId: dto.buyerId,
        description: dto.description,
        photoUrl: dto.photoUrl,
        status: 'SUBMITTED',
        defectCategory,
        severity,
        draftedSupplierAlert,
      },
    });

    if (severity.toUpperCase() === 'CRITICAL') {
      this.gateway.emitCriticalComplaint(complaint);
    }

    return { ...complaint, manualRequired };
  }

  async resolveComplaint(id: string, dto: ResolveComplaintDto) {
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolutionType: dto.resolutionType,
      },
    });
  }

  async getTraceback(orderItemId: string) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            driver: true,
          }
        },
        product: {
          include: {
            farmer: true,
          }
        },
      }
    });

    if (!orderItem) {
      throw new Error('OrderItem not found');
    }

    return {
      farmOrigin: orderItem.product.farmer.name,
      harvestDate: orderItem.product.harvestDate,
      deliveryRunInfo: {
        driverName: orderItem.order.driver?.name || 'Unassigned',
        deliveryAddress: orderItem.order.deliveryAddress,
        status: orderItem.order.status,
      },
      productDetails: {
        name: orderItem.product.name,
        variety: orderItem.product.variety,
      }
    };
  }
}
