import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryScheduleReport,
  DeliveryStopStatus,
  OrderStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { DeliveryGateway } from './delivery.gateway';
import {
  AcceptRouteOrderDto,
  AssignDeliveryDto,
  OptimizeRouteDto,
  UpdateStopStatusDto,
} from './dto/delivery.dto';

interface RouteStop {
  orderId: string;
  address: string;
  latitude: number;
  longitude: number;
  sequence: number;
  coordinatesAreApproximate: boolean;
}

interface AiRouteResponse {
  orderedOrderIds: string[];
  rationale: string;
}

interface StopOrderShape {
  id: string;
  status: OrderStatus;
  deliveryStopStatus: DeliveryStopStatus | null;
  deliveryAddress: string;
  deliveryNotes: string | null;
  scheduledDeliveryDate: Date | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  stopSequence: number | null;
  failedReason: string | null;
  deliveredAt: Date | null;
  totalAmount: number;
  buyer?: unknown;
  driver?: unknown;
  items?: unknown[];
}

interface RouteOrderShape {
  id: string;
  deliveryAddress: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  stopSequence: number | null;
}

@Injectable()
export class DeliveryService {
  private readonly defaultDepot = { latitude: 24.8607, longitude: 67.0011 };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly gateway: DeliveryGateway,
  ) {}

  getDrivers() {
    return this.prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }

  getUnassignedOrders() {
    return this.prisma.order.findMany({
      where: {
        driverId: null,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PACKED] },
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignDeliveries(dto: AssignDeliveryDto) {
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
      select: { id: true, name: true, role: true },
    });

    if (!driver || driver.role !== Role.DRIVER) {
      throw new BadRequestException(
        'The selected user is not a delivery driver',
      );
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
      select: { id: true, status: true, driverId: true },
    });

    if (orders.length !== dto.orderIds.length) {
      throw new NotFoundException('One or more selected orders were not found');
    }

    const invalidOrder = orders.find(
      (order) =>
        (order.status !== OrderStatus.CONFIRMED &&
          order.status !== OrderStatus.PACKED) ||
        order.driverId !== null,
    );
    if (invalidOrder) {
      throw new BadRequestException(
        `Order ${invalidOrder.id} must be confirmed or packed and unassigned`,
      );
    }

    const coordinateMap = new Map(
      (dto.stops || []).map((stop) => [stop.orderId, stop]),
    );
    if (coordinateMap.size !== (dto.stops || []).length) {
      throw new BadRequestException(
        'Coordinates for each selected order may only be supplied once',
      );
    }
    const unknownCoordinate = (dto.stops || []).find(
      (stop) => !dto.orderIds.includes(stop.orderId),
    );
    if (unknownCoordinate) {
      throw new BadRequestException(
        `Coordinates were supplied for an unselected order: ${unknownCoordinate.orderId}`,
      );
    }

    const scheduledDeliveryDate = new Date(dto.scheduledDeliveryDate);
    await this.prisma.$transaction(
      dto.orderIds.map((orderId, index) => {
        const stop = coordinateMap.get(orderId);
        return this.prisma.order.update({
          where: { id: orderId },
          data: {
            driverId: dto.driverId,
            deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
            scheduledDeliveryDate,
            deliveryLatitude: stop?.latitude,
            deliveryLongitude: stop?.longitude,
            stopSequence: stop?.sequence ?? index + 1,
            failedReason: null,
            deliveredAt: null,
          },
        });
      }),
    );

    const assignedOrders = await this.prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { stopSequence: 'asc' },
    });

    this.gateway.emitDeliveryAssigned(dto.driverId, {
      scheduledDeliveryDate,
      orders: assignedOrders.map((order) => this.toStop(order)),
    });

    return {
      driver: { id: driver.id, name: driver.name },
      scheduledDeliveryDate,
      orders: assignedOrders.map((order) => this.toStop(order)),
    };
  }

  async getDriverStops(driverId: string, date?: string) {
    const dateFilter = date ? this.getDayBounds(new Date(date)) : undefined;
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        deliveryStopStatus: { not: null },
        ...(dateFilter && {
          scheduledDeliveryDate: { gte: dateFilter.start, lt: dateFilter.end },
        }),
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
      orderBy: [{ scheduledDeliveryDate: 'asc' }, { stopSequence: 'asc' }],
    });

    return orders.map((order) => this.toStop(order));
  }

  async updateStopStatus(
    orderId: string,
    driverId: string,
    dto: UpdateStopStatusDto,
  ) {
    if (
      dto.status !== DeliveryStopStatus.DELIVERED &&
      dto.status !== DeliveryStopStatus.FAILED
    ) {
      throw new BadRequestException(
        'A stop can only be marked delivered or failed',
      );
    }
    if (
      dto.status === DeliveryStopStatus.FAILED &&
      !dto.failureReason?.trim()
    ) {
      throw new BadRequestException(
        'A failure reason is required for a failed stop',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: { select: { id: true, name: true } } },
    });
    if (!order) {
      throw new NotFoundException('Delivery stop not found');
    }
    if (order.driverId !== driverId) {
      throw new ForbiddenException('You can only update your assigned stops');
    }
    if (!order.deliveryStopStatus) {
      throw new BadRequestException(
        'This order has not been scheduled for delivery',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStopStatus: dto.status,
        status:
          dto.status === DeliveryStopStatus.DELIVERED
            ? OrderStatus.DELIVERED
            : order.status,
        failedReason:
          dto.status === DeliveryStopStatus.FAILED
            ? dto.failureReason!.trim()
            : null,
        deliveredAt:
          dto.status === DeliveryStopStatus.DELIVERED ? new Date() : null,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    const payload = this.toStop(updated);
    this.gateway.emitStopUpdated(order.buyer.id, payload);
    return payload;
  }

  async trackOrder(orderId: string, requesterId: string, requesterRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (requesterRole !== Role.ADMIN && order.buyerId !== requesterId) {
      throw new ForbiddenException('You can only track your own orders');
    }

    return this.toStop(order);
  }

  async optimizeRoute(driverId: string, dto: OptimizeRouteDto) {
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
        ...(dto.orderIds && { id: { in: dto.orderIds } }),
      },
      include: { buyer: { select: { name: true } } },
      orderBy: { stopSequence: 'asc' },
    });

    if (dto.orderIds && orders.length !== dto.orderIds.length) {
      throw new BadRequestException(
        'Every selected order must be an active stop assigned to you',
      );
    }
    if (orders.length === 0) {
      throw new BadRequestException(
        'No active delivery stops are available to optimize',
      );
    }

    const stops = orders.map((order) => this.toRouteStop(order));
    const systemPrompt = `You are the FreshRoute delivery route optimizer. Reorder only the supplied order IDs.
Return strict JSON with this shape: {"orderedOrderIds":["uuid"],"rationale":"short explanation"}.
The output must contain every supplied order ID exactly once and no additional IDs. Respect the driver's constraints before minimizing travel distance.`;
    const prompt = `Depot: ${JSON.stringify(this.defaultDepot)}
Stops: ${JSON.stringify(stops)}
Driver constraints: ${dto.constraints?.trim() || 'No special constraints.'}`;

    try {
      const result = await this.aiService.getJsonCompletion<AiRouteResponse>(
        prompt,
        systemPrompt,
      );
      this.validateRouteOrder(result.orderedOrderIds, stops);
      return {
        orderedOrderIds: result.orderedOrderIds,
        stops: this.sortStops(stops, result.orderedOrderIds),
        rationale: result.rationale || 'The AI optimized the stop sequence.',
        isFallback: false,
      };
    } catch {
      const fallbackStops = this.sortByNearestNeighbor(stops);
      return {
        orderedOrderIds: fallbackStops.map((stop) => stop.orderId),
        stops: fallbackStops,
        rationale:
          'The AI service is unavailable. Stops were ordered using straight-line distance from the depot and then from each previous stop.',
        isFallback: true,
      };
    }
  }

  async acceptRoute(driverId: string, dto: AcceptRouteOrderDto) {
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        id: { in: dto.orderedOrderIds },
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
      },
      select: { id: true },
    });
    if (orders.length !== dto.orderedOrderIds.length) {
      throw new BadRequestException(
        'Every order must be an active stop assigned to you',
      );
    }

    await this.prisma.$transaction(
      dto.orderedOrderIds.map((orderId, index) =>
        this.prisma.order.update({
          where: { id: orderId },
          data: { stopSequence: index + 1 },
        }),
      ),
    );

    return {
      accepted: true,
      stops: await this.getDriverStops(driverId),
    };
  }

  async generateDailyScheduleReports(date = new Date()) {
    const { start, end } = this.getDayBounds(date);
    const scheduleDate = new Date(start);
    const stops = await this.prisma.order.findMany({
      where: {
        driverId: { not: null },
        scheduledDeliveryDate: { gte: start, lt: end },
        deliveryStopStatus: { not: null },
      },
      include: { driver: { select: { id: true, name: true } } },
      orderBy: [{ driverId: 'asc' }, { stopSequence: 'asc' }],
    });

    const grouped = new Map<
      string,
      { driverName: string; stops: typeof stops }
    >();
    for (const stop of stops) {
      if (!stop.driverId || !stop.driver) continue;
      const current = grouped.get(stop.driverId) || {
        driverName: stop.driver.name,
        stops: [],
      };
      current.stops.push(stop);
      grouped.set(stop.driverId, current);
    }

    const reports: DeliveryScheduleReport[] = [];
    for (const [driverId, group] of grouped.entries()) {
      const deliveredStops = group.stops.filter(
        (stop) => stop.deliveryStopStatus === DeliveryStopStatus.DELIVERED,
      ).length;
      const failedStops = group.stops.filter(
        (stop) => stop.deliveryStopStatus === DeliveryStopStatus.FAILED,
      ).length;
      const pendingStops = group.stops.length - deliveredStops - failedStops;
      const summary = `${group.driverName}: ${group.stops.length} stops scheduled, ${pendingStops} pending, ${deliveredStops} delivered, ${failedStops} failed.`;

      const report = await this.prisma.deliveryScheduleReport.upsert({
        where: { driverId_scheduleDate: { driverId, scheduleDate } },
        create: {
          driverId,
          scheduleDate,
          totalStops: group.stops.length,
          pendingStops,
          deliveredStops,
          failedStops,
          summary,
        },
        update: {
          totalStops: group.stops.length,
          pendingStops,
          deliveredStops,
          failedStops,
          summary,
        },
      });
      reports.push(report);
    }
    return reports;
  }

  getScheduleReports(date?: string) {
    const dateFilter = date ? this.getDayBounds(new Date(date)) : undefined;
    return this.prisma.deliveryScheduleReport.findMany({
      where: dateFilter
        ? { scheduleDate: { gte: dateFilter.start, lt: dateFilter.end } }
        : undefined,
      include: { driver: { select: { id: true, name: true, email: true } } },
      orderBy: [{ scheduleDate: 'desc' }, { driver: { name: 'asc' } }],
    });
  }

  private toStop(order: StopOrderShape) {
    const coordinates = this.resolveCoordinates(order);
    return {
      id: order.id,
      orderId: order.id,
      buyer: order.buyer,
      driver: order.driver,
      orderStatus: order.status,
      stopStatus: order.deliveryStopStatus,
      deliveryAddress: order.deliveryAddress,
      deliveryNotes: order.deliveryNotes,
      scheduledDeliveryDate: order.scheduledDeliveryDate,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      coordinatesAreApproximate: coordinates.approximate,
      stopSequence: order.stopSequence,
      failedReason: order.failedReason,
      deliveredAt: order.deliveredAt,
      totalAmount: order.totalAmount,
      items: order.items,
    };
  }

  private toRouteStop(order: RouteOrderShape): RouteStop {
    const coordinates = this.resolveCoordinates(order);
    return {
      orderId: order.id,
      address: order.deliveryAddress,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      sequence: order.stopSequence || 0,
      coordinatesAreApproximate: coordinates.approximate,
    };
  }

  private resolveCoordinates(order: {
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    deliveryAddress: string;
  }) {
    if (order.deliveryLatitude !== null && order.deliveryLongitude !== null) {
      return {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
        approximate: false,
      };
    }

    let hash = 0;
    for (const character of order.deliveryAddress) {
      hash = (hash * 31 + character.charCodeAt(0)) | 0;
    }
    const latitudeOffset = (((hash >>> 0) % 1000) / 1000 - 0.5) * 0.12;
    const longitudeOffset =
      ((((hash >>> 10) >>> 0) % 1000) / 1000 - 0.5) * 0.12;
    return {
      latitude: this.defaultDepot.latitude + latitudeOffset,
      longitude: this.defaultDepot.longitude + longitudeOffset,
      approximate: true,
    };
  }

  private validateRouteOrder(orderIds: string[], stops: RouteStop[]) {
    if (!Array.isArray(orderIds) || orderIds.length !== stops.length) {
      throw new Error('AI returned an invalid number of stops');
    }
    const expected = new Set(stops.map((stop) => stop.orderId));
    if (new Set(orderIds).size !== orderIds.length) {
      throw new Error('AI returned duplicate stops');
    }
    if (orderIds.some((orderId) => !expected.has(orderId))) {
      throw new Error('AI returned an unknown stop');
    }
  }

  private sortStops(stops: RouteStop[], orderIds: string[]) {
    const stopMap = new Map(stops.map((stop) => [stop.orderId, stop]));
    return orderIds.map((orderId, index) => ({
      ...stopMap.get(orderId)!,
      sequence: index + 1,
    }));
  }

  private sortByNearestNeighbor(stops: RouteStop[]) {
    const remaining = [...stops];
    const result: RouteStop[] = [];
    let current = this.defaultDepot;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      remaining.forEach((stop, index) => {
        const distance = this.haversineDistance(current, stop);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const [nearest] = remaining.splice(nearestIndex, 1);
      result.push({ ...nearest, sequence: result.length + 1 });
      current = nearest;
    }
    return result;
  }

  private haversineDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) {
    const earthRadiusKm = 6371;
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(to.latitude - from.latitude);
    const longitudeDelta = radians(to.longitude - from.longitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(from.latitude)) *
        Math.cos(radians(to.latitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private getDayBounds(date: Date) {
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('A valid date is required');
    }
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
}
