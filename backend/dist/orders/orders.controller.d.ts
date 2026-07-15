import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, dto: CreateOrderDto): Promise<{
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
    findAll(req: any): Promise<({
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
    updateStatus(req: any, id: string, status: OrderStatus): Promise<{
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
