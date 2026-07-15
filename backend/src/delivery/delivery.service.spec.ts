/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DeliveryStopStatus, OrderStatus, Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prisma: any;
  let aiService: any;
  let gateway: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      deliveryScheduleReport: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    aiService = { getJsonCompletion: jest.fn() };
    gateway = {
      emitDeliveryAssigned: jest.fn(),
      emitStopUpdated: jest.fn(),
    };
    service = new DeliveryService(prisma, aiService, gateway);
  });

  it('rejects assignment when the selected user is not a driver', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Buyer',
      role: Role.BUYER,
    });

    await expect(
      service.assignDeliveries({
        driverId: 'user-1',
        orderIds: ['order-1'],
        scheduledDeliveryDate: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a reason before a stop can be marked failed', async () => {
    await expect(
      service.updateStopStatus('order-1', 'driver-1', {
        status: DeliveryStopStatus.FAILED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("prevents a driver from updating another driver's stop", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      driverId: 'driver-2',
      buyer: { id: 'buyer-1', name: 'Buyer' },
      deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
    });

    await expect(
      service.updateStopStatus('order-1', 'driver-1', {
        status: DeliveryStopStatus.DELIVERED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks an owned stop delivered and notifies its buyer', async () => {
    const assignedOrder = {
      id: 'order-1',
      buyerId: 'buyer-1',
      driverId: 'driver-1',
      buyer: { id: 'buyer-1', name: 'Buyer' },
      status: OrderStatus.IN_TRANSIT,
      deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
      deliveryAddress: 'Clifton, Karachi',
      deliveryLatitude: 24.81,
      deliveryLongitude: 67.03,
      scheduledDeliveryDate: new Date(),
      stopSequence: 1,
      totalAmount: 100,
      items: [],
    };
    prisma.order.findUnique.mockResolvedValue(assignedOrder);
    prisma.order.update.mockResolvedValue({
      ...assignedOrder,
      status: OrderStatus.DELIVERED,
      deliveryStopStatus: DeliveryStopStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    const result = await service.updateStopStatus('order-1', 'driver-1', {
      status: DeliveryStopStatus.DELIVERED,
    });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          status: OrderStatus.DELIVERED,
          deliveryStopStatus: DeliveryStopStatus.DELIVERED,
        }),
      }),
    );
    expect(gateway.emitStopUpdated).toHaveBeenCalledWith(
      'buyer-1',
      expect.objectContaining({ orderId: 'order-1' }),
    );
    expect(result.stopStatus).toBe(DeliveryStopStatus.DELIVERED);
  });

  it('falls back to straight-line ordering when the AI is offline', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'far-stop',
        driverId: 'driver-1',
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
        deliveryAddress: 'Far address',
        deliveryLatitude: 25.1,
        deliveryLongitude: 67.2,
        stopSequence: 1,
      },
      {
        id: 'near-stop',
        driverId: 'driver-1',
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
        deliveryAddress: 'Near address',
        deliveryLatitude: 24.861,
        deliveryLongitude: 67.002,
        stopSequence: 2,
      },
    ]);
    aiService.getJsonCompletion.mockRejectedValue(new Error('offline'));

    const result = await service.optimizeRoute('driver-1', {
      constraints: 'No constraints',
    });

    expect(result.isFallback).toBe(true);
    expect(result.orderedOrderIds).toEqual(['near-stop', 'far-stop']);
    expect(result.stops.map((stop) => stop.sequence)).toEqual([1, 2]);
  });

  it('rejects AI output that omits a stop and uses the fallback', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        driverId: 'driver-1',
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
        deliveryAddress: 'Address one',
        deliveryLatitude: 24.87,
        deliveryLongitude: 67.01,
        stopSequence: 1,
      },
      {
        id: 'order-2',
        driverId: 'driver-1',
        deliveryStopStatus: DeliveryStopStatus.ASSIGNED,
        deliveryAddress: 'Address two',
        deliveryLatitude: 24.88,
        deliveryLongitude: 67.02,
        stopSequence: 2,
      },
    ]);
    aiService.getJsonCompletion.mockResolvedValue({
      orderedOrderIds: ['order-1'],
      rationale: 'Incomplete response',
    });

    const result = await service.optimizeRoute('driver-1', {});

    expect(result.isFallback).toBe(true);
    expect(result.orderedOrderIds).toHaveLength(2);
  });
});
