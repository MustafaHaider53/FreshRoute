import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../websockets/events.gateway';
import { OrderStatus } from '@prisma/client';
export declare class OrdersService {
    private readonly db;
    private readonly eventsGateway;
    constructor(db: PrismaService, eventsGateway: EventsGateway);
    createOrder(buyerId: string, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            orderId: string;
            productId: string;
            quantityOrdered: number;
            quantityDelivered: number | null;
            priceAtOrder: number;
        }[];
    } & {
        id: string;
        buyerId: string;
        driverId: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        deliveryAddress: string;
        deliveryNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getOrders(userId: string, role: string): Promise<({
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                variety: string;
                unit: string;
                price: number;
                quantity: number;
                harvestDate: Date;
                shelfLifeDays: number;
                farmerId: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantityOrdered: number;
            quantityDelivered: number | null;
            priceAtOrder: number;
        })[];
    } & {
        id: string;
        buyerId: string;
        driverId: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        deliveryAddress: string;
        deliveryNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    updateOrderStatus(id: string, status: OrderStatus, user: any): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                variety: string;
                unit: string;
                price: number;
                quantity: number;
                harvestDate: Date;
                shelfLifeDays: number;
                farmerId: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantityOrdered: number;
            quantityDelivered: number | null;
            priceAtOrder: number;
        })[];
    } & {
        id: string;
        buyerId: string;
        driverId: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        deliveryAddress: string;
        deliveryNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
