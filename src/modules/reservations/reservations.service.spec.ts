import { BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const buildQueryBuilder = (existingReservation: unknown) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(async () => existingReservation),
  });

  it('rejects overlapping reservations for the same table', async () => {
    const queryBuilder = buildQueryBuilder({ id: 'reservation-1' });
    const reservationRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'reservation-2', ...value })),
    };
    const service = new ReservationsService(reservationRepository as any);

    await expect(
      service.create({
        table_id: '11111111-1111-4111-8111-111111111111',
        customer_name: 'Guest',
        party_size: 2,
        reservation_time: '2026-01-01T18:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a reservation when the table has no overlap', async () => {
    const queryBuilder = buildQueryBuilder(null);
    const reservationRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'reservation-1', status: 'pending', ...value })),
    };
    const service = new ReservationsService(reservationRepository as any);

    const result = await service.create({
      table_id: '11111111-1111-4111-8111-111111111111',
      customer_name: 'Guest',
      party_size: 2,
      reservation_time: '2026-01-01T18:00:00.000Z',
    });

    expect(result.id).toBe('reservation-1');
    expect(reservationRepository.save).toHaveBeenCalled();
  });
});
