import { OrderItemStatus, OrderStatus } from '../../common/enums';
import { KitchenService } from './kitchen.service';

describe('KitchenService', () => {
  it('updates an item status and syncs the parent order status', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      items: [
        { id: 'item-1', status: OrderItemStatus.COOKING, menuItem: { prepTimeMinutes: 10 } },
        { id: 'item-2', status: OrderItemStatus.PENDING, menuItem: { prepTimeMinutes: 5 } },
      ],
    };
    const itemRepository = {
      findOne: jest.fn(async () => ({
        id: 'item-1',
        orderId: 'order-1',
        status: OrderItemStatus.PENDING,
        order,
      })),
      save: jest.fn(async (item) => item),
    };
    const orderRepository = {
      findOne: jest.fn(async () => order),
      save: jest.fn(async (nextOrder) => nextOrder),
    };
    const service = new KitchenService(
      orderRepository as any,
      itemRepository as any,
      { subscribe: jest.fn() } as any,
    );

    const result = await service.updateOrderItemStatus(
      'item-1',
      OrderItemStatus.COOKING,
    );

    expect(result.status).toBe(OrderItemStatus.COOKING);
    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.IN_PROGRESS }),
    );
  });
});
