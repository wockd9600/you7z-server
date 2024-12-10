import { GamePlayer } from '@prisma/client';
import { GameUserDto } from '../room/dto/game-user.dto';

export class GameUserMapper {
  static toUserDto(user: GamePlayer): GameUserDto {
    return new GameUserDto(user);
  }

  static toUserDtos(playlists: GamePlayer[]): GameUserDto[] {
    return playlists.map(this.toUserDto);
  }
}

export function mergeUserDetails(
  names: { user_id: number; nickname: string }[],
  scores: { user_id: number; score: number }[],
  orders: { user_id: number; order: number }[],
) {
  const nameDict: { [key: number]: string } = names.reduce(
    (acc, item) => {
      acc[item.user_id] = item.nickname;
      return acc;
    },
    {} as { [key: number]: string },
  );

  const orderDict: { [key: number]: number } = orders.reduce(
    (acc, item) => {
      acc[`${item.user_id}`] = item.order;
      return acc;
    },
    {} as { [key: number]: number },
  );

  return scores.map((scoreItem) => ({
    userId: scoreItem.user_id,
    nickname: nameDict[scoreItem.user_id],
    order: orderDict[scoreItem.user_id],
    score: scoreItem.score,
  }));
}
