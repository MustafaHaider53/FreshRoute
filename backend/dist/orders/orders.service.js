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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const events_gateway_1 = require("../websockets/events.gateway");
let OrdersService = class OrdersService {
    db;
    eventsGateway;
    constructor(db, eventsGateway) {
        this.db = db;
        this.eventsGateway = eventsGateway;
    }
    async createOrder(buyerId, dto) {
        if (dto.items.length === 0) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        return this.db.$transaction(async (prisma) => {
            let totalAmount = 0;
            const orderItemsToCreate = [];
            const farmersInvolved = new Set();
            for (const item of dto.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Product ${item.productId} not found`);
                }
                if (product.quantity < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Requested ${item.quantity}, available ${product.quantity}`);
                }
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { quantity: product.quantity - item.quantity },
                });
                totalAmount += product.price * item.quantity;
                orderItemsToCreate.push({
                    productId: product.id,
                    quantityOrdered: item.quantity,
                    priceAtOrder: product.price,
                });
                farmersInvolved.add(product.farmerId);
            }
            const order = await prisma.order.create({
                data: {
                    buyerId,
                    totalAmount,
                    deliveryAddress: dto.deliveryAddress,
                    deliveryNotes: dto.deliveryNotes,
                    items: {
                        create: orderItemsToCreate,
                    },
                },
                include: { items: true },
            });
            return order;
        });
    }
    async getOrders(userId, role) {
        if (role === 'BUYER') {
            return this.db.order.findMany({
                where: { buyerId: userId },
                include: { items: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        else if (role === 'FARMER') {
            return this.db.order.findMany({
                where: {
                    items: {
                        some: {
                            product: {
                                farmerId: userId,
                            },
                        },
                    },
                },
                include: { items: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        else if (role === 'ADMIN' || role === 'DRIVER') {
            return this.db.order.findMany({
                include: { items: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        return [];
    }
    async updateOrderStatus(id, status, user) {
        const order = await this.db.order.findUnique({
            where: { id },
            include: { items: { include: { product: true } } },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (user.role === 'FARMER') {
            const hasItem = order.items.some((i) => i.product.farmerId === user.id);
            if (!hasItem) {
                throw new common_1.BadRequestException('Not authorized to update this order');
            }
        }
        const updatedOrder = await this.db.order.update({
            where: { id },
            data: { status },
            include: { items: { include: { product: true } } },
        });
        if (status === 'CONFIRMED') {
            const farmerIds = new Set(order.items.map((i) => i.product.farmerId));
            farmerIds.forEach((farmerId) => {
                this.eventsGateway.server.to(`user_${farmerId}`).emit('order.confirmed', {
                    orderId: order.id,
                    message: 'A new order containing your products has been confirmed!',
                });
            });
        }
        return updatedOrder;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map