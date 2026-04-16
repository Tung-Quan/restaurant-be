import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.ensureUsersTable();
    await this.ensureRelations();
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
  }
}
