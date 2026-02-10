import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';
import {
  InvitationStatus,
  WeddingGuest,
} from './entities/wedding-guest.entity';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

@Injectable()
export class WeddingGuestService {
  private readonly logger = new Logger(WeddingGuestService.name);
  private collectionName = 'wedding-guests'; // Changed per user request

  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  buildGuestUrl(token: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4321'; // Default or from env
    return `${baseUrl}/i/${token}`;
  }

  async create(
    createWeddingGuestDto: CreateWeddingGuestDto,
  ): Promise<WeddingGuest> {
    try {
      // Auto-generate token and URL if not provided
      const token = createWeddingGuestDto.token || this.generateToken();
      const guestUrl =
        createWeddingGuestDto.guest_url || this.buildGuestUrl(token);

      const newItem = {
        ...createWeddingGuestDto,
        token,
        guest_url: guestUrl,
        estado_invitacion:
          createWeddingGuestDto.estado_invitacion || InvitationStatus.PENDING,
        created_at: Timestamp.now(),
        limit_date: Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ),
        updated_at: Timestamp.now(),
      };

      const docRef = await this.firestore
        .collection(this.collectionName)
        .add(newItem);
      const doc = await docRef.get();
      const guest = { id: doc.id, ...doc.data() } as WeddingGuest;

      this.logger.log(`New usuario ${guest.nombre} added with id: ${guest.id}`);

      return guest;
    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw error;
    }
  }

  async findAll(): Promise<WeddingGuest[]> {
    const snapshot = await this.firestore.collection(this.collectionName).get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as WeddingGuest,
    );
  }

  async findOne(id: string): Promise<WeddingGuest> {
    const doc = await this.firestore
      .collection(this.collectionName)
      .doc(id)
      .get();
    if (!doc.exists) {
      throw new NotFoundException(`Wedding guest with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as WeddingGuest;
  }

  async rotateUrl(id: string): Promise<{ guest_url: string }> {
    await this.findOne(id);
    const newToken = this.generateToken();
    const newUrl = this.buildGuestUrl(newToken);

    await this.firestore.collection(this.collectionName).doc(id).update({
      token: newToken,
      guest_url: newUrl,
      updated_at: Timestamp.now(),
    });

    return { guest_url: newUrl };
  }

  async importFromCsv(rows: any[]): Promise<void> {
    const batch = this.firestore.batch();
    const collectionRef = this.firestore.collection(this.collectionName);

    // Fetch all existing guests to check for duplicates by Name (normalized)
    const snapshot = await collectionRef.get();
    const existingGuests = new Map<string, any>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.nombre)
        existingGuests.set(data.nombre.trim().toLowerCase(), {
          id: doc.id,
          ...data,
        });
    });

    let operationsCount = 0;

    for (const row of rows) {
      const name = row.nombre?.trim();
      if (!name) continue;

      const normalizedName = name.toLowerCase();
      const existing = existingGuests.get(normalizedName);

      if (existing) {
        // Update existing (preserve token/url)
        const docRef = collectionRef.doc(existing.id);
        const updateData: any = {
          adicionales: row.adicionales
            ? Number(row.adicionales)
            : existing.adicionales,
          updated_at: Timestamp.now(),
        };
        // Update other fields if necessary
        batch.update(docRef, updateData);
      } else {
        // Create new
        const docRef = collectionRef.doc();
        const token = this.generateToken();
        const guestUrl = this.buildGuestUrl(token);
        const newItem = {
          nombre: name,
          adicionales: row.adicionales ? Number(row.adicionales) : 0,
          token,
          guest_url: guestUrl,
          estado_invitacion: InvitationStatus.PENDING,
          created_at: Timestamp.now(),
          limit_date: Timestamp.fromDate(
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ),
          updated_at: Timestamp.now(),
        };
        batch.set(docRef, newItem);
      }

      operationsCount++;
    }

    if (operationsCount > 0) {
      await batch.commit();
    }
  }

  async findByToken(token: string): Promise<WeddingGuest> {
    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Invalid token');
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WeddingGuest;
  }

  async registerVisit(token: string): Promise<WeddingGuest> {
    const guest = await this.findByToken(token);
    
    if (!guest.first_visit_at) {
      await this.firestore
        .collection(this.collectionName)
        .doc(guest.id)
        .update({
          first_visit_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });
      guest.first_visit_at = Timestamp.now();
    }

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
      // 30 days = 30 * 24 * 60 * 60 * 1000 = 2592000000 ms
      limitTime = guest.created_at.toMillis() + 2592000000;
    }

    if (limitTime > 0 && now > limitTime) {
      throw new BadRequestException('The deadline to respond has passed');
    }

    const updateData: any = {
      estado_invitacion: status,
      updated_at: Timestamp.now(),
    };

    if (status === InvitationStatus.ACCEPTED) {
      updateData.accepted_at = Timestamp.now();
      if (plusOnes !== undefined) {
        updateData.plus_ones_selected = plusOnes;
      }
    }

    await this.firestore
      .collection(this.collectionName)
      .doc(guest.id)
      .update(updateData);

    return { ...guest, ...updateData };
  }
}
