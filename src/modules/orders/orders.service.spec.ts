import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '../../common/enums';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const buildService = () => {
    const orderRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (order) => ({
        id: 'order-1',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:01:00Z'),
        ...order,
        items: order.items?.map((item, index) => ({
          id: `item-${index + 1}`,
          ...item,
        })),
      })),
      findOne: jest.fn(),
    };
    const orderItemRepository = {
      create: jest.fn((value) => value),
    };
    const menuItemRepository = {
      find: jest.fn(async () => [
        { id: 'menu-1', name: 'Pho', price: 10, isAvailable: true },
        { id: 'menu-2', name: 'Coffee', price: 5, isAvailable: true },
      ]),
    };
    const eventBus = {
      publishAsync: jest.fn(),
    };
    const activityLogService = {
      log: jest.fn(async () => undefined),
    };
    const outboxEventService = {
      createPending: jest.fn(async () => ({ id: 'outbox-1' })),
      publishById: jest.fn(async () => undefined),
      recordAndPublish: jest.fn(async () => ({ id: 'outbox-2' })),
    };
    const manager = {
      create: jest.fn((entity, value) => value),
      save: jest.fn(async (entity, order) => ({
        id: 'order-1',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:01:00Z'),
        ...order,
        items: order.items?.map((item, index) => ({
          id: `item-${index + 1}`,
          ...item,
        })),
      })),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const service = new OrdersService(
      orderRepository as any,
      orderItemRepository as any,
      menuItemRepository as any,
      dataSource as any,
      { get: jest.fn(() => 10) } as unknown as ConfigService,
      eventBus as any,
      outboxEventService as any,
      activityLogService as any,
    );

    return {
      service,
      orderRepository,
      menuItemRepository,
      eventBus,
      activityLogService,
      outboxEventService,
      manager,
    };
  };

  it('calculates prices from menu items instead of trusting client unit prices', async () => {
    const { service, manager, outboxEventService } = buildService();

    const result = await service.create(
      {
        table_id: '11111111-1111-4111-8111-111111111111',
        items: [
          {
            menu_item_id: 'menu-1',
            quantity: 2,
            unit_price: 1,
          },
          {
            menu_item_id: 'menu-2',
            quantity: 1,
            unit_price: 1,
          },
        ],
      },
      'server-1',
    );

    expect(manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        subtotal: 25,
        tax: 2.5,
        totalAmount: 27.5,
      }),
    );
    expect(outboxEventService.createPending).toHaveBeenCalled();
    expect(outboxEventService.publishById).toHaveBeenCalledWith('outbox-1');
    expect(result.total_amount).toBe(27.5);
  });

  it('rejects unavailable menu items', async () => {
    const { service, menuItemRepository } = buildService();
    menuItemRepository.find.mockResolvedValueOnce([
      { id: 'menu-1', name: 'Pho', price: 10, isAvailable: false },
    ]);

    await expect(
      service.create({
        table_id: '11111111-1111-4111-8111-111111111111',
        items: [{ menu_item_id: 'menu-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels unpaid active orders and publishes a realtime update', async () => {
    const { service, orderRepository, outboxEventService, activityLogService } = buildService();
    orderRepository.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      updatedAt: new Date('2026-01-01T10:01:00Z'),
    });

    const result = await service.cancel('order-1');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.CANCELLED }),
    );
    expect(outboxEventService.recordAndPublish).toHaveBeenCalled();
    expect(activityLogService.log).toHaveBeenCalledWith(
      '',
      'CANCEL_ORDER',
      'orders',
      'order-1',
      { status: OrderStatus.CANCELLED },
    );
  });
});
