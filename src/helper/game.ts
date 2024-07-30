import IGameRepository from "../repositories/interfaces/game";
import { RedisUtil } from "../utils/redis";

export function mergeUserDetails(names: { user_id: number; nickname: string }[], scores: { user_id: number; score: number }[], orders: { user_id: number; order: number }[]) {
    const nameDict: { [key: number]: string } = names.reduce((acc, item) => {
        acc[item.user_id] = item.nickname;
        return acc;
    }, {} as { [key: number]: string });

    const orderDict: { [key: number]: number } = orders.reduce((acc, item) => {
        acc[`${item.user_id}`] = item.order;
        return acc;
    }, {} as { [key: number]: number });

    return scores.map((scoreItem) => ({
        id: scoreItem.user_id,
        nickname: nameDict[scoreItem.user_id],
        order: orderDict[scoreItem.user_id],
        score: scoreItem.score,
    }));
}

export async function fetchGameRoomUsersData(gameRepository: IGameRepository, redisUtil: RedisUtil) {
    try {
        // (redis) 현재 유저들 order 가져옴
        const redisUsers = redisUtil.getUsers();
        const user_ids = redisUsers.map((user) => user.user_id);

        // 현재 유저들 이름 가져옴
        // (redis) 현재 유저들 score 가져옴
        const [userProfiles, scores] = await Promise.all([gameRepository.findAllUserName(user_ids), redisUtil.getUsersScore()]);

        if (!userProfiles || userProfiles.length === 0) throw new Error("사용자 프로필을 찾을 수 없습니다.");
        if (!scores || scores.length === 0) throw new Error("사용자 점수를 찾을 수 없습니다.");

        const names = userProfiles.map((profile) => ({
            user_id: profile.user_id,
            nickname: profile.nickname,
        }));

        // user_id로 score, order, name 매치
        const gameRoomUsersData = mergeUserDetails(names, scores, redisUsers);
        return gameRoomUsersData;
    } catch (error) {
        throw error;
    }
}
