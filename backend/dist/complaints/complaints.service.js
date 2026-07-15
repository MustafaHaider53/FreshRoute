"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ComplaintsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const complaints_gateway_1 = require("./complaints.gateway");
let ComplaintsService = ComplaintsService_1 = class ComplaintsService {
    prisma;
    aiService;
    gateway;
    logger = new common_1.Logger(ComplaintsService_1.name);
    constructor(prisma, aiService, gateway) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.gateway = gateway;
    }
    async createComplaint(dto) {
        let classification = null;
        let defectCategory = 'UNCLASSIFIED';
        let severity = 'UNKNOWN';
        let draftedSupplierAlert = null;
        let manualRequired = false;
        try {
            const prompt = `Classify this fresh produce complaint. Return JSON with 'defectCategory' (e.g., FRESHNESS, PACKAGING, CONTAMINATION, OTHER), 'severity' (MINOR, MAJOR, CRITICAL), and 'draftedSupplierAlert' (a short warning message to the supplier). Complaint: "${dto.description}"`;
            classification = await this.aiService.getJsonCompletion(prompt);
            defectCategory = classification.defectCategory || 'UNCLASSIFIED';
            severity = classification.severity || 'UNKNOWN';
            draftedSupplierAlert = classification.draftedSupplierAlert || null;
        }
        catch (error) {
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
    async resolveComplaint(id, dto) {
        return this.prisma.complaint.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolutionType: dto.resolutionType,
            },
        });
    }
    async getTraceback(orderItemId) {
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
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = ComplaintsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        complaints_gateway_1.ComplaintsGateway])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map