import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';
import { UpdateWeddingGuestDto } from './dto/update-wedding-guest.dto';
import {
  InvitationStatus,
  WeddingGuest,
} from './entities/wedding-guest.entity';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

@Injectable()
export class WeddingGuestService {
  private readonly logger = new Logger(WeddingGuestService.name);
  private collectionName = 'wedding-guests';

  private allGuestsCache: { data: WeddingGuest[] | null; expiresAt: number } = { data: null, expiresAt: 0 };
  private guestCache = new Map<string, { data: WeddingGuest; expiresAt: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  private clearCache(guestId?: string, token?: string) {
    this.allGuestsCache = { data: null, expiresAt: 0 };
    if (guestId) {
      this.guestCache.delete(guestId);
    }
    if (token) {
      this.guestCache.delete(token);
    }
    if (!guestId && !token) {
      this.guestCache.clear();
    }
  }

  generateToken(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Generate 10 random bytes and map to chars
    return Array.from(crypto.randomFillSync(new Uint8Array(10)))
      .map((x) => chars[x % chars.length])
      .join('');
  }

  buildGuestUrl(token: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4321';
    return `${baseUrl}/i/${token}`;
  }

  async create(
    createWeddingGuestDto: CreateWeddingGuestDto,
  ): Promise<WeddingGuest> {
    try {
      let token = createWeddingGuestDto.token;

      // Ensure unique token if generating
      if (!token) {
        let isUnique = false;
        while (!isUnique) {
            token = this.generateToken();
            const existing = await this.firestore
                .collection(this.collectionName)
                .where('token', '==', token)
                .get();
            if (existing.empty) {
                isUnique = true;
            }
        }
      }

      const guestUrl =
        createWeddingGuestDto.guest_url || this.buildGuestUrl(token as string);

      const newItem = {
        name: createWeddingGuestDto.name,
        plus_ones_allowed: createWeddingGuestDto.plus_ones_allowed || 0,
        token,
        guest_url: guestUrl,
        status: createWeddingGuestDto.status || InvitationStatus.NOT_OPEN,
        created_at: Timestamp.now(),
        // 2 weeks from now
        limit_date: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ),
        updated_at: Timestamp.now(),
      };

      const docRef = await this.firestore
        .collection(this.collectionName)
        .add(newItem);
      const doc = await docRef.get();
      const guest = { id: doc.id, ...doc.data() } as WeddingGuest;

      this.logger.log(`New guest ${guest.name} added with id: ${guest.id}`);

      this.clearCache(guest.id, guest.token);

      return guest;
    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw error;
    }
  }

  async findAll(): Promise<WeddingGuest[]> {
    const now = Date.now();
    if (this.allGuestsCache.data && this.allGuestsCache.expiresAt > now) {
      return this.allGuestsCache.data;
    }

    const snapshot = await this.firestore.collection(this.collectionName).get();
    const guests = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as WeddingGuest,
    );

    this.allGuestsCache = {
      data: guests,
      expiresAt: now + this.CACHE_TTL,
    };

    guests.forEach((guest) => {
      this.guestCache.set(guest.id, { data: guest, expiresAt: now + this.CACHE_TTL });
      if (guest.token) {
        this.guestCache.set(guest.token, { data: guest, expiresAt: now + this.CACHE_TTL });
      }
    });

    return guests;
  }

  async findOne(id: string): Promise<WeddingGuest> {
    const now = Date.now();
    const cached = this.guestCache.get(id);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const doc = await this.firestore
      .collection(this.collectionName)
      .doc(id)
      .get();
    if (!doc.exists) {
      throw new NotFoundException(`Wedding guest with ID ${id} not found`);
    }
    const guest = { id: doc.id, ...doc.data() } as WeddingGuest;

    this.guestCache.set(id, { data: guest, expiresAt: now + this.CACHE_TTL });
    if (guest.token) {
      this.guestCache.set(guest.token, { data: guest, expiresAt: now + this.CACHE_TTL });
    }

    return guest;
  }

  async update(id: string, updateWeddingGuestDto: UpdateWeddingGuestDto): Promise<WeddingGuest> {
    const guest = await this.findOne(id);

    const updateData = {
      ...updateWeddingGuestDto,
      updated_at: Timestamp.now(),
    };

    await this.firestore
      .collection(this.collectionName)
      .doc(id)
      .update(updateData);

    const updatedGuest = { ...guest, ...updateData };
    this.clearCache(updatedGuest.id, updatedGuest.token);

    return updatedGuest;
  }

  async rotateUrl(id: string): Promise<{ guest_url: string }> {
    const guest = await this.findOne(id);
    const newToken = this.generateToken();
    const newUrl = this.buildGuestUrl(newToken);

    await this.firestore.collection(this.collectionName).doc(id).update({
      token: newToken,
      guest_url: newUrl,
      updated_at: Timestamp.now(),
    });

    this.clearCache(guest.id, guest.token);

    return { guest_url: newUrl };
  }

  async importFromCsv(rows: any[]): Promise<void> {
    const batch = this.firestore.batch();
    const collectionRef = this.firestore.collection(this.collectionName);

    // Fetch all existing guests to check for duplicates by Name and collect existing tokens
    const snapshot = await collectionRef.get();
    const existingGuests = new Map<string, any>();
    const existingTokens = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Support both new 'name' and legacy 'nombre'
      const guestName = data.name || data.nombre;
      if (guestName) {
        existingGuests.set(guestName.trim().toLowerCase(), {
          id: doc.id,
          ...data,
        });
      }
      if (data.token) {
        existingTokens.add(data.token);
      }
    });

    let operationsCount = 0;

    for (const row of rows) {
      // Map legacy/csv fields to new fields
      const name = row.nombre?.trim() || row.name?.trim();
      if (!name) continue;

      const normalizedName = name.toLowerCase();
      const existing = existingGuests.get(normalizedName);

      const plusOnes = row.adicionales
        ? Number(row.adicionales)
        : (row.plus_ones_allowed ? Number(row.plus_ones_allowed) : 0);

      if (existing) {
        // Update existing guest: migrate fields and update allowed count
        const docRef = collectionRef.doc(existing.id);
        const updateData: any = {
          plus_ones_allowed: plusOnes,
          updated_at: Timestamp.now(),
          // Always update name to match CSV (e.g. casing fix) and migrate field
          name: name,
        };

        // Migrate status if missing
        if (!existing.status) {
            updateData.status = existing.estado_invitacion || InvitationStatus.NOT_OPEN;
        }

        // Migrate limit_date if missing
        if (!existing.limit_date) {
             if (existing.created_at) {
                 // 2 weeks from creation
                 updateData.limit_date = Timestamp.fromDate(new Date(existing.created_at.toMillis() + 14 * 24 * 60 * 60 * 1000));
             } else {
                 // 2 weeks from now
                 updateData.limit_date = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
             }
        }

        batch.update(docRef, updateData);
      } else {
        // Create new
        const docRef = collectionRef.doc();

        let token = this.generateToken();
        while (existingTokens.has(token)) {
            token = this.generateToken();
        }
        existingTokens.add(token);

        const guestUrl = this.buildGuestUrl(token);
        const newItem = {
          name: name,
          plus_ones_allowed: plusOnes,
          token,
          guest_url: guestUrl,
          status: InvitationStatus.NOT_OPEN,
          created_at: Timestamp.now(),
          limit_date: Timestamp.fromDate(
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          ),
          updated_at: Timestamp.now(),
        };
        batch.set(docRef, newItem);
      }

      operationsCount++;
    }

    if (operationsCount > 0) {
      await batch.commit();
      this.clearCache();
    }
  }

  async findByToken(token: string): Promise<WeddingGuest> {
    const now = Date.now();
    const cached = this.guestCache.get(token);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Invalid token');
    }

    const doc = snapshot.docs[0];
    const guest = { id: doc.id, ...doc.data() } as WeddingGuest;

    this.guestCache.set(token, { data: guest, expiresAt: now + this.CACHE_TTL });
    this.guestCache.set(guest.id, { data: guest, expiresAt: now + this.CACHE_TTL });

    return guest;
  }

  async registerVisit(token: string): Promise<WeddingGuest> {
    const guest = await this.findByToken(token);
    
    // Always update last_visit_at
    await this.firestore
      .collection(this.collectionName)
      .doc(guest.id)
      .update({
        last_visit_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

    guest.last_visit_at = Timestamp.now();

    this.clearCache(guest.id, guest.token);

    return guest;
  }

  async updateRsvp(
    token: string,
    status: InvitationStatus,
    plusOnes?: number,
  ): Promise<WeddingGuest> {
    const guest = await this.findByToken(token);

    const now = Date.now();
    let limitTime = 0;

    if (guest.limit_date) {
      limitTime = guest.limit_date.toMillis();
    } else if (guest.created_at) {
      // Fallback: 2 weeks = 1209600000 ms
      limitTime = guest.created_at.toMillis() + 1209600000;
    }

    if (limitTime > 0 && now > limitTime) {
      throw new BadRequestException('The deadline to respond has passed');
    }

    const updateData: any = {
      status: status,
      updated_at: Timestamp.now(),
    };

    if (status === InvitationStatus.ACCEPTED) {
      updateData.accepted_at = Timestamp.now();
      if (plusOnes !== undefined) {
        updateData.plus_ones_confirmed = plusOnes;
      }
    }

    await this.firestore
      .collection(this.collectionName)
      .doc(guest.id)
      .update(updateData);

    const updatedGuest = { ...guest, ...updateData };
    this.clearCache(updatedGuest.id, updatedGuest.token);

    return updatedGuest;
  }
}
