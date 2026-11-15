import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import pg from 'pg';

export type RecapServiceType = 'INFORMASI' | 'BANTUAN';

export interface CreateWhatsappRecapDto {
  reporterName: string;
  reporterPhone: string;
  address?: string;
  serviceType: RecapServiceType;
  description: string;
  notes?: string;
  ticketId?: string;
}

export interface CreateComplaintDto {
  reporterName: string;
  reporterPhone: string;
  address?: string;
  description: string;
  ticketId?: string;
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
   * Menyimpan permohonan informasi atau bantuan warga ke tabel silantas.whatsapp_recaps.
   */
  async createWhatsappRecap(data: CreateWhatsappRecapDto): Promise<ComplaintResult> {
    const id = randomUUID();
    const shortCode = id.slice(0, 8).toUpperCase();
    const prefix = data.serviceType === 'INFORMASI' ? 'INF' : 'ADU';
    const ticketNo = data.ticketId || `${prefix}-${shortCode}`;
    const address = data.address?.trim() || 'Kabupaten Mimika';
    const defaultNote =
      data.serviceType === 'INFORMASI'
        ? 'Permohonan Informasi via WhatsApp Bot'
        : 'Permohonan Bantuan via WhatsApp Bot';
    const notes = data.notes?.trim() || defaultNote;
    const now = new Date();

    const query = `
      INSERT INTO silantas.whatsapp_recaps
      (id, ticket_id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'BARU', 'Bot WhatsApp (Otomatis)', $8, $9, $10)
      RETURNING id;
    `;

    const values = [
      id,
      ticketNo,
      data.reporterName || 'Warga (Tanpa Nama)',
      data.reporterPhone || '',
      address,
      data.serviceType,
      data.description,
      notes,
      now,
      now,
    ];

    try {
      if (this.pool) {
        await this.pool.query(query, values);
        this.logger.log(
          `Rekapan ${data.serviceType} berhasil disimpan. ID: ${id}, Tiket: ${ticketNo}, Pelapor: ${data.reporterName}`,
        );
      }
    } catch (err) {
      this.logger.error(`Gagal menyimpan rekapan ke database: ${(err as Error).message}`);
    }

    return { id, ticketNo };
  }

  /**
   * Menyimpan aduan keluhan warga secara otomatis ke tabel silantas.whatsapp_recaps.
   */
  async createComplaintRecap(data: CreateComplaintDto): Promise<ComplaintResult> {
    return this.createWhatsappRecap({
      ...data,
      serviceType: 'BANTUAN',
    });
  }
}
