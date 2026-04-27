import { BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  const buildService = () => {
    const orderRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (order) => order),
    };
    const activityLogService = {
      log: jest.fn(async () => undefined),
    };
    const service = new BillingService(orderRepository as any, activityLogService as any);
    return { service, orderRepository, activityLogService };
  };

  it('rejects payment amounts below the order total', async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findOne.mockResolvedValueOnce({
      id: 'order-1',
      subtotal: 20,
      tax: 5,
      discount: 0,
      totalAmount: 25,
      paymentStatus: PaymentStatus.UNPAID,
    });

    await expect(
      service.processPayment('order-1', {
        method: PaymentMethod.CASH,
        amount: 24.99,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records valid payments and marks the order completed', async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findOne.mockResolvedValueOnce({
      id: 'order-1',
      subtotal: 20,
      tax: 5,
      discount: 0,
      totalAmount: 25,
      paymentStatus: PaymentStatus.UNPAID,
    });

    const result = await service.processPayment('order-1', {
      method: PaymentMethod.CARD,
      amount: 25,
    });

    expect(result.payment_status).toBe(PaymentStatus.PAID);
    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        status: OrderStatus.COMPLETED,
      }),
    );
  });

  it('calculates even split bills', async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findOne.mockResolvedValueOnce({
      id: 'order-1',
      subtotal: 20,
      tax: 2,
      discount: 0,
      totalAmount: 22,
      items: [{ id: 'item-1' }, { id: 'item-2' }],
    });

    const result = await service.splitBill('order-1', {
      mode: 'even',
      guest_count: 2,
    });

    expect(result.split_bill.mode).toBe('even');
    expect(result.split_bill.shares).toHaveLength(2);
    expect(result.split_bill.shares[0].total_amount).toBe(11);
  });

  it('applies supported promotion codes and tips during payment recording', async () => {
    const { service, orderRepository, activityLogService } = buildService();
    orderRepository.findOne.mockResolvedValueOnce({
      id: 'order-1',
      subtotal: 100,
      tax: 10,
      discount: 0,
      totalAmount: 110,
      paymentStatus: PaymentStatus.UNPAID,
    });

    const result = await service.processPayment(
      'order-1',
      {
        method: PaymentMethod.CASH,
        amount: 105,
        promotion_code: 'SAVE10',
        tip_amount: 5,
      },
      'user-1',
    );

    expect(result.discount).toBe(10);
    expect(result.tip_amount).toBe(5);
    expect(result.total_amount).toBe(105);
    expect(activityLogService.log).toHaveBeenCalledWith(
      'user-1',
      'PROCESS_PAYMENT',
      'orders',
      'order-1',
      expect.objectContaining({ promotion_code: 'SAVE10', tip_amount: 5 }),
    );
  });
});
