import { Test, TestingModule } from '@nestjs/testing';
import { GameRoomRuleService } from './room-rule.service';

describe('GameRoomRuleService', () => {
  let service: GameRoomRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameRoomRuleService],
    }).compile();

    service = module.get<GameRoomRuleService>(GameRoomRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
