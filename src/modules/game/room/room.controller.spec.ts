import { Test, TestingModule } from '@nestjs/testing';
import { GameRoomtController } from './room.controller';

describe('GameRoomController', () => {
  let controller: GameRoomtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameRoomtController],
    }).compile();

    controller = module.get<GameRoomtController>(GameRoomtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
