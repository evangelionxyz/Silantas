import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import pg from 'pg';

export interface CreateComplaintDto {
  reporterName: string;
  reporterPhone: string;
  address?: string;
  description: string;
}

export interface ComplaintResult {
  id: string;
  ticketNo: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool?: pg.Pool;

  onModuleInit() {
    const user = process.env.POSTGRESQL_USERNAME || 'postgres';
    const password = process.env.POSTGRESQL_PASSWORD || '1234';
    const host = process.env.POSTGRESQL_HOST || 'localhost';
    const port = Number(process.env.POSTGRESQL_PORT || 5432);
    const database = process.env.POSTGRESQL_DATABASE || 'postgres';

    const connectionString =
      process.env.POSTGRESQL_DATABASE_URL ||
      process.env.DATABASE_URL ||
      undefined;

    this.pool = new pg.Pool(
      connectionString
        ? { connectionString, max: 5 }
        : {
            user,
            password,
            host,
            port,
            database,
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 10000,
          },
    );

    this.logger.log(`Database pool initialized for ${host}:${port}/${database}`);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  /**
   * Menyimpan aduan keluhan warga secara otomatis ke tabel silantas.whatsapp_recaps.
   * Ditandai dengan service_type = 'BANTUAN' dan status = 'BARU'.
   */
  async createComplaintRecap(data: CreateComplaintDto): Promise<ComplaintResult> {
    const id = randomUUID();
    const shortCode = id.slice(0, 8).toUpperCase();
    const ticketNo = `ADU-${shortCode}`;
    const address = data.address?.trim() || 'Kabupaten Mimika';
    const now = new Date();

    const query = `
      INSERT INTO silantas.whatsapp_recaps
      (id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'BANTUAN', $5, 'BARU', 'Bot WhatsApp (Otomatis)', 'Aduan Masuk via WhatsApp Bot', $6, $7)
      RETURNING id;
    `;

    const values = [
      id,
      data.reporterName || 'Warga (Tanpa Nama)',
      data.reporterPhone || '',
      address,
      data.description,
      now,
      now,
    ];

    try {
      if (this.pool) {
        await this.pool.query(query, values);
        this.logger.log(`Keluhan berhasil disimpan ke database. ID: ${id}, Tiket: ${ticketNo}, Pelapor: ${data.reporterName}`);
      }
    } catch (err) {
      this.logger.error(`Gagal menyimpan rekapan ke database: ${(err as Error).message}`);
    }

    return { id, ticketNo };
  }
}
