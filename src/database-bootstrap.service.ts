import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.ensureUsersTable();
    await this.ensureBillingRecordsTable();
    await this.ensureOrdersTableColumns();
    await this.ensureRelations();
    await this.backfillBillingRecords();
  }

  private async ensureUsersTable() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_users_updated_at'
        ) THEN
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
        END IF;
      END
      $$;
    `);
  }

  private async ensureOrdersTableColumns() {
    await this.dataSource.query(`
      ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS promotion_code TEXT NULL,
      ADD COLUMN IF NOT EXISTS payment_method TEXT NULL,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS split_bill JSONB NULL
    `);
  }

  private async ensureBillingRecordsTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS public.billing_records (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL,
        table_id UUID NULL,
        table_number INTEGER NULL,
        payment_method TEXT NOT NULL,
        amount_paid NUMERIC(10, 2) NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        tax NUMERIC(10, 2) NOT NULL,
        discount NUMERIC(10, 2) NOT NULL,
        tip_amount NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        promotion_code TEXT NULL,
        paid_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  private async ensureRelations() {
    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'profiles_user_id_users_fkey'
        ) THEN
          ALTER TABLE public.profiles
          ADD CONSTRAINT profiles_user_id_users_fkey
          FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'user_roles_user_id_users_fkey'
        ) THEN
          ALTER TABLE public.user_roles
          ADD CONSTRAINT user_roles_user_id_users_fkey
          FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'billing_records_order_id_orders_fkey'
        ) THEN
          ALTER TABLE public.billing_records
          ADD CONSTRAINT billing_records_order_id_orders_fkey
          FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'billing_records_table_id_restaurant_tables_fkey'
        ) THEN
          ALTER TABLE public.billing_records
          ADD CONSTRAINT billing_records_table_id_restaurant_tables_fkey
          FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  private async backfillBillingRecords() {
    await this.dataSource.query(`
      INSERT INTO public.billing_records (
        order_id,
        table_id,
        table_number,
        payment_method,
        amount_paid,
        subtotal,
        tax,
        discount,
        tip_amount,
        total_amount,
        promotion_code,
        paid_at
      )
      SELECT
        orders.id,
        orders.table_id,
        restaurant_tables.table_number,
        COALESCE(orders.payment_method, 'cash'),
        orders.total_amount,
        orders.subtotal,
        orders.tax,
        orders.discount,
        orders.tip_amount,
        orders.total_amount,
        orders.promotion_code,
        COALESCE(orders.paid_at, orders.updated_at, orders.created_at)
      FROM public.orders
      LEFT JOIN public.restaurant_tables
        ON restaurant_tables.id = orders.table_id
      WHERE orders.payment_status = 'paid'
        AND NOT EXISTS (
          SELECT 1
          FROM public.billing_records
          WHERE billing_records.order_id = orders.id
        )
    `);
  }
}
