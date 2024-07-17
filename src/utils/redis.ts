import redisClient from "../utils/redis";

export default class RedisUtil {
    public session_id: number;
    public users: number[] = [];

    constructor(session_id: number) {
        this.session_id = session_id;
    }

    // await redisClient.set(`friend-code-${room_id}`, code, 'EX', 60);

    getUsersScore() {
        // 현재 유저들 score 가져옴
        // 현재 유저들 가져옴
        // for f"session:{session_id}:user:{user_id}:score"
        // 저장
    }

    isUserInRoom() {
        // 유저가 있는지 확인
    }

    checkUserCount() {
        // 인원수 문제 없는지 확인
        // 현재 유저들 가져옴
        // 1 < length < 8
    }

    addUser() {
        // 인원수 한 명 추가
        // score_key = f"session:{session_id}:user 에 user_id 추가
        // score_key = f"session:{session_id}:user:{user_id}:score"
        // score = 0
    }

    setUserScore() {
        // 유저 스코어 설정
    }

    getUsers() {
        // 현재 유저들 가져옴
        // f"session:{session_id}:user"
    }

    isRoomManager() {
        // 유저가 방장인지 확인
        // f"session:{session_id}:user"
        // index:0이면 방장
    }

    getSing() {
        // 현재 노래 가져오기
        // f"session:{session_id}:song"
        // 현재 노래 설정
        // f"session:{session_id}:song"

    }

    async deleteUser(user_id: number) {
        // 유저 삭제
        const newUsers = this.users.filter((value) => value !== user_id);

        const userKey = `session:${this.session_id}:user`;
        await redisClient.set(userKey, JSON.stringify(newUsers), "EX", 60 * 60);

        const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
        await redisClient.del(userScoreKey);
    }
}
