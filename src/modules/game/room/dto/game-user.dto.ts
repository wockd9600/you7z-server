export class GameUserDto {
  userId: number;
  nickname: string;
  order: number;
  score: number;
  isReady: boolean;

  constructor(user: any) {
    this.userId = user.id;
    this.order = user.playerId;
    this.nickname = user.nickname;
    this.score = user.score;
    this.isReady = user.isReady;
  }
}
