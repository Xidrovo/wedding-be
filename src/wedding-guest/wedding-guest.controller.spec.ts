import { Test, TestingModule } from '@nestjs/testing';
import { WeddingGuestController } from './wedding-guest.controller';
import { WeddingGuestService } from './wedding-guest.service';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';

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
    it('should create the first guest from CSV (Beatriz Vallejo)', async () => {
      // Data from CSV line 2: TRUE,Beatriz Vallejo (Madre del novio),0,Familia,N/A,N/A,Casita del novio,FISICA,Por invitar,,Aceptado,1,1,
      // Only sending fields where Invitar is TRUE
      const guestData: CreateWeddingGuestDto = {
        nombre: 'Beatriz Vallejo (Madre del novio)',
        adicionales: 0,
        estado_invitacion: 'Por invitar',
        estado_aceptacion: 'Aceptado',
        posible_invitado: 1,
      };

      await controller.create(guestData);

      expect(service.create).toHaveBeenCalledWith(guestData);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });
});
