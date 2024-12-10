import { Test, TestingModule } from '@nestjs/testing';
import { GameSessionGateway } from './session.gateway';

describe('GameSessionGateway', () => {
  let gateway: GameSessionGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSessionGateway],
    }).compile();

    gateway = module.get<GameSessionGateway>(GameSessionGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
