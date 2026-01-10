import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';
import { WeddingGuest } from './entities/wedding-guest.entity';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class WeddingGuestService {
  private collectionName = 'wedding_guest_list';

  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  async create(createWeddingGuestDto: CreateWeddingGuestDto): Promise<WeddingGuest> {
    try {
      const docRef = await this.firestore.collection(this.collectionName).add(createWeddingGuestDto);
      const doc = await docRef.get();
      const guest = { id: doc.id, ...doc.data() } as WeddingGuest;
      
      console.log(`New usuario ${guest.nombre} added with id: ${guest.id}`);
      
      return guest;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async findAll(): Promise<WeddingGuest[]> {
    const snapshot = await this.firestore.collection(this.collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeddingGuest));
  }

  async findOne(id: string): Promise<WeddingGuest> {
    const doc = await this.firestore.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Wedding guest with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as WeddingGuest;
  }
}
