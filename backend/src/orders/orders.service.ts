import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../websockets/events.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.db.$transaction(async (prisma) => {
      let totalAmount = 0;
      const orderItemsToCreate: any[] = [];
      const farmersInvolved = new Set<string>();

      for (const item of dto.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Requested ${item.quantity}, available ${product.quantity}`,
          );
        }

        // Deduct stock
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

      // Create Order
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

  async getOrders(userId: string, role: string) {
    if (role === 'BUYER') {
      return this.db.order.findMany({
        where: { buyerId: userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'FARMER') {
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
    } else if (role === 'ADMIN' || role === 'DRIVER') {
      return this.db.order.findMany({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    
    return [];
  }

  async updateOrderStatus(id: string, status: OrderStatus, user: any) {
    const order = await this.db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === 'FARMER') {
      const hasItem = order.items.some((i) => i.product.farmerId === user.id);
      if (!hasItem) {
        throw new BadRequestException('Not authorized to update this order');
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
}
