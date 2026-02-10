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
  let docMock: any;

  beforeEach(async () => {
    docMock = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
    };

    collectionMock = {
      add: jest.fn(),
      get: jest.fn(),
      doc: jest.fn(() => docMock),
    };

    firestoreMock = {
      collection: jest.fn(() => collectionMock),
      batch: jest.fn(() => ({
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      })),
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

  describe('create', () => {
    it('should create a guest with a limit date 1 month from now', async () => {
      const createDto = {
        nombre: 'Test Guest',
      };

      const mockDocRef = { id: 'new-id', get: jest.fn() };
      const mockSnapshot = { id: 'new-id', data: jest.fn(() => ({})) };

      collectionMock.add.mockResolvedValue(mockDocRef);
      mockDocRef.get.mockResolvedValue(mockSnapshot);

      await service.create(createDto);

      expect(collectionMock.add).toHaveBeenCalled();
      const addedGuest = collectionMock.add.mock.calls[0][0];
      expect(addedGuest.limit_date).toBeDefined();

      // Check if limit_date is approximately 30 days from now
      const now = Date.now();
      const limitDate = addedGuest.limit_date.toDate().getTime();
      const diff = limitDate - now;
      const days = diff / (1000 * 60 * 60 * 24);

      expect(days).toBeCloseTo(30, 0); // Should be roughly 30 days
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

      collectionMock.get.mockResolvedValue({
        docs: [{ id: guestId, data: () => mockGuest }],
      });

      await service.updateRsvp(token, InvitationStatus.ACCEPTED);

      expect(docMock.update).toHaveBeenCalled();
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

      collectionMock.get.mockResolvedValue({
        docs: [{ id: guestId, data: () => mockGuest }],
      });

      await expect(
        service.updateRsvp(token, InvitationStatus.ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate limit date from created_at if limit_date missing (backward compatibility)', async () => {
      const token = 'legacy-token';
      const guestId = 'guest-id';

      // created_at 31 days ago (expired)
      const oldCreation = Timestamp.fromDate(
        new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      );

      const mockGuest = {
        id: guestId,
        token,
        created_at: oldCreation,
        // no limit_date
      };

      collectionMock.get.mockResolvedValue({
        docs: [{ id: guestId, data: () => mockGuest }],
      });

      await expect(
        service.updateRsvp(token, InvitationStatus.ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow update if limit_date missing but created_at is recent (backward compatibility)', async () => {
      const token = 'recent-token';
      const guestId = 'guest-id';

      // created_at 1 day ago (valid)
      const recentCreation = Timestamp.fromDate(
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      );

      const mockGuest = {
        id: guestId,
        token,
        created_at: recentCreation,
        // no limit_date
      };

      collectionMock.get.mockResolvedValue({
        docs: [{ id: guestId, data: () => mockGuest }],
      });

      await service.updateRsvp(token, InvitationStatus.ACCEPTED);
      expect(docMock.update).toHaveBeenCalled();
    });
  });
});
