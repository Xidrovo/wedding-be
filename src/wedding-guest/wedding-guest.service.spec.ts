import { Test, TestingModule } from '@nestjs/testing';
import { WeddingGuestService } from './wedding-guest.service';
import {
  InvitationStatus,
  WeddingGuest,
} from './entities/wedding-guest.entity';
import { Timestamp } from 'firebase-admin/firestore';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WeddingGuestService', () => {
  let service: WeddingGuestService;
  let firestoreMock: any;
  let collectionMock: any;
  let queryMock: any;
  let docMock: any;
  let batchMock: any;

  beforeEach(async () => {
    docMock = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
    };

    queryMock = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    collectionMock = {
      add: jest.fn(),
      get: jest.fn(),
      doc: jest.fn(() => docMock),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
            get: jest.fn()
        }))
      })),
    };

    batchMock = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
    };

    firestoreMock = {
      collection: jest.fn(() => collectionMock),
      batch: jest.fn(() => batchMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeddingGuestService,
        {
          provide: 'FIRESTORE',
          useValue: firestoreMock,
        },
      ],
    }).compile();

    service = module.get<WeddingGuestService>(WeddingGuestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update and return the updated guest', async () => {
      const guestId = 'guest-id';
      const updateDto = { name: 'Updated Name', plus_ones_allowed: 5 };
      const existingGuest = {
        id: guestId,
        name: 'Old Name',
        plus_ones_allowed: 2,
        status: InvitationStatus.NOT_OPEN,
      };

      // Mock findOne to return existingGuest
      docMock.get.mockResolvedValue({
        exists: true,
        id: guestId,
        data: () => existingGuest,
      });

      collectionMock.doc.mockReturnValue(docMock);
      docMock.update.mockResolvedValue(undefined);

      const result = await service.update(guestId, updateDto);

      expect(docMock.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Name',
        plus_ones_allowed: 5,
        updated_at: expect.any(Timestamp),
      }));

      expect(result.name).toEqual('Updated Name');
      expect(result.plus_ones_allowed).toEqual(5);
      expect(result.id).toEqual(guestId);
    });

    it('should throw NotFoundException if guest not found', async () => {
      const guestId = 'non-existent-id';
      const updateDto = { name: 'Updated Name' };

      docMock.get.mockResolvedValue({
        exists: false,
      });
      collectionMock.doc.mockReturnValue(docMock);

      await expect(service.update(guestId, updateDto)).rejects.toThrow(NotFoundException);
      expect(docMock.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a guest with a limit date 2 weeks from now', async () => {
      const createDto = {
        name: 'Test Guest',
      };

      const mockDocRef = { id: 'new-id', get: jest.fn() };
      const mockSnapshot = { id: 'new-id', data: jest.fn(() => ({ name: 'Test Guest' })) };

      collectionMock.add.mockResolvedValue(mockDocRef);
      mockDocRef.get.mockResolvedValue(mockSnapshot);
      // For token check
      const queryMock = { get: jest.fn().mockResolvedValue({ empty: true }) };
      collectionMock.where.mockReturnValue(queryMock);

      await service.create(createDto);

      expect(collectionMock.add).toHaveBeenCalled();
      const addedGuest = collectionMock.add.mock.calls[0][0];
      expect(addedGuest.limit_date).toBeDefined();

      // Check if limit_date is approximately 14 days from now
      const now = Date.now();
      const limitDate = addedGuest.limit_date.toDate().getTime();
      const diff = limitDate - now;
      const days = diff / (1000 * 60 * 60 * 24);

      expect(days).toBeCloseTo(14, 0);
    });
  });

  describe('updateRsvp', () => {
    it('should update RSVP if within limit date', async () => {
      const token = 'valid-token';
      const guestId = 'guest-id';

      // Future limit date
      const futureLimit = Timestamp.fromDate(new Date(Date.now() + 1000000));

      const mockGuest = {
        id: guestId,
        token,
        limit_date: futureLimit,
        created_at: Timestamp.now(),
      };

      const queryMock = {
          get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [{ id: guestId, data: () => mockGuest }]
          })
      };

      // Setup where().limit().get() chain
      collectionMock.where.mockReturnValue({
          limit: jest.fn().mockReturnValue(queryMock)
      });

      await service.updateRsvp(token, InvitationStatus.ACCEPTED);

      expect(docMock.update).toHaveBeenCalledWith(expect.objectContaining({
          status: InvitationStatus.ACCEPTED
      }));
    });

    it('should throw BadRequestException if past limit date', async () => {
      const token = 'expired-token';
      const guestId = 'guest-id';

      // Past limit date
      const pastLimit = Timestamp.fromDate(new Date(Date.now() - 1000000));

      const mockGuest = {
        id: guestId,
        token,
        limit_date: pastLimit,
        created_at: Timestamp.now(),
      };

      const queryMock = {
          get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [{ id: guestId, data: () => mockGuest }]
          })
      };

      collectionMock.where.mockReturnValue({
          limit: jest.fn().mockReturnValue(queryMock)
      });

      await expect(
        service.updateRsvp(token, InvitationStatus.ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('importFromCsv', () => {
    it('should update existing guest and migrate fields', async () => {
        // Setup
        const existingGuest = {
            id: 'old-id',
            nombre: 'Old Name', // Legacy field
            adicionales: 1,
            created_at: Timestamp.now(),
        };

        const rows = [
            { nombre: 'Old Name', adicionales: 2 }
        ];

        // Mocks
        const collectionGetMock = {
            docs: [{ id: 'old-id', data: () => existingGuest }]
        };
        collectionMock.get.mockResolvedValue(collectionGetMock);
        // Ensure doc() returns docMock with id 'old-id'
        collectionMock.doc.mockReturnValue(docMock);

        await service.importFromCsv(rows);

        expect(batchMock.update).toHaveBeenCalledWith(
            expect.anything(), // doc ref
            expect.objectContaining({
                name: 'Old Name',
                status: InvitationStatus.NOT_OPEN, // Should be added default
                plus_ones_allowed: 2
            })
        );
    });

    it('should create new guest with new fields', async () => {
         const rows = [
            { nombre: 'New Guest', adicionales: 0 }
         ];

         collectionMock.get.mockResolvedValue({ docs: [] }); // No existing guests
         collectionMock.doc.mockReturnValue(docMock); // For new doc ref

         await service.importFromCsv(rows);

         expect(batchMock.set).toHaveBeenCalledWith(
             expect.anything(),
             expect.objectContaining({
                 name: 'New Guest',
                 status: InvitationStatus.NOT_OPEN,
                 plus_ones_allowed: 0,
                 token: expect.any(String)
             })
         );
    });
  });
});
