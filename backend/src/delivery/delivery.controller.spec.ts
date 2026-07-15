import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryStopStatus, Role } from '@prisma/client';

describe('DeliveryController', () => {
  let controller: DeliveryController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      getDrivers: jest.fn(),
      getUnassignedOrders: jest.fn(),
      assignDeliveries: jest.fn(),
      getDriverStops: jest.fn(),
      updateStopStatus: jest.fn(),
      optimizeRoute: jest.fn(),
      acceptRoute: jest.fn(),
      trackOrder: jest.fn(),
      getScheduleReports: jest.fn(),
      generateDailyScheduleReports: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [{ provide: DeliveryService, useValue: service }],
    }).compile();
    controller = module.get(DeliveryController);
  });

  it('passes the authenticated driver identity to stop updates', async () => {
    service.updateStopStatus.mockResolvedValue({ orderId: 'order-1' });
    const dto = { status: DeliveryStopStatus.DELIVERED };

    await controller.updateStopStatus(
      'order-1',
      { user: { id: 'driver-1', role: Role.DRIVER } } as never,
      dto,
    );

    expect(service.updateStopStatus).toHaveBeenCalledWith(
      'order-1',
      'driver-1',
      dto,
    );
  });

  it('passes buyer identity and role to order tracking', async () => {
    service.trackOrder.mockResolvedValue({ orderId: 'order-1' });

    await controller.trackOrder('order-1', {
      user: { id: 'buyer-1', role: Role.BUYER },
    } as never);

    expect(service.trackOrder).toHaveBeenCalledWith(
      'order-1',
      'buyer-1',
      Role.BUYER,
    );
  });
});
