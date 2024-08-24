import IGameRepository from "../repositories/interfaces/game";
import { RedisUtil } from "../utils/redis";

import GameRoom from "../models/GameRoom";
import GameSession from "../models/GameSession";
import Song from "../models/Song";

function generateRoomCode() {
    const length = 6;
    const characters = "0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

export function generateRandomOrder(songs: Song[], goal_score: number) {
    const shuffled = songs.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, goal_score);
}

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
        userId: scoreItem.user_id,
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

export async function getGameSessionFromRoomCode(gameRepository: IGameRepository, room_code: string) {
    try {
        const gameRoomData = new GameRoom({ room_code });
        const gameRoom = await gameRepository.findOneGameRoom(gameRoomData);
        if (gameRoom === null) throw new Error("방 정보를 찾을 수 없습니다. (GameRoom 조회 실패)");

        const gameSessionData = new GameSession({ room_id: gameRoom.room_id });
        const gameSession = await gameRepository.findOneGameSession(gameSessionData);
        if (gameSession === null) throw new Error("방 정보를 찾을 수 없습니다. (GameSession 조회 실패)");

        return { gameRoom, gameSession };
    } catch (error) {
        throw error;
    }
}

export async function createUniqueRoomCode(gameRepository: IGameRepository) {
    let isUnique = false;
    let room_code;

    while (!isUnique) {
        room_code = generateRoomCode();
        const gameRoomData = new GameRoom({ room_code });
        const existingRoom = await gameRepository.findOneGameRoom(gameRoomData);
        if (!existingRoom) {
            isUnique = true;
        }
    }

    return room_code;
}
