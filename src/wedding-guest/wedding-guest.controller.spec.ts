import { Test, TestingModule } from '@nestjs/testing';
import { WeddingGuestController } from './wedding-guest.controller';
import { WeddingGuestService } from './wedding-guest.service';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';
import { InvitationStatus } from './entities/wedding-guest.entity';

describe('WeddingGuestController', () => {
  let controller: WeddingGuestController;
  let service: WeddingGuestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeddingGuestController],
      providers: [
        {
          provide: WeddingGuestService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'test-id' }),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
            registerVisit: jest.fn(),
            updateRsvp: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WeddingGuestController>(WeddingGuestController);
    service = module.get<WeddingGuestService>(WeddingGuestService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a guest with correct data', async () => {
      const guestData: CreateWeddingGuestDto = {
        name: 'Beatriz Vallejo (Madre del novio)',
        plus_ones_allowed: 0,
        status: InvitationStatus.NOT_OPEN,
      };

      await controller.create(guestData);

      expect(service.create).toHaveBeenCalledWith(guestData);
    });
  });
});
