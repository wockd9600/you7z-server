import redisClient from "../modules/redis-client";

export default async function createRedisUtil(session_id: number): Promise<RedisUtil> {
    const redisUtil = new RedisUtil(session_id);
    await redisUtil.initialize();
    return redisUtil;
}

export class RedisUtil {
    public session_id: number;
    public users: number[] = [];

    constructor(session_id: number) {
        this.session_id = session_id;
    }

    public async initialize(): Promise<void> {
        // 현재 유저들 가져옴 "session:{session_id}:user"
        try {
            const pattern = `session:${this.session_id}:user:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length === 0) return;

            const users = await Promise.all(
                keys.map(async (key) => {
                    const userData = await redisClient.get(key);
                    if (userData) {
                        const user_id = JSON.parse(userData);
                        return user_id;
                    }
                    return null;
                })
            );

            this.users = users.filter((user_id) => user_id !== null);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }

    public async agreeNextAction(user_id: number): Promise<void> {
        // 플레이 준비 완료
        const agreeNextActionKey = `session:${this.session_id}:user:${user_id}:agreeNextAction`;
        await redisClient.set(agreeNextActionKey, "true", { EX: 60 * 60 });
    }

    public async isALLAgreeNextAction(): Promise<boolean> {
        // 유저들의 동영상 로딩이 전부 준비 되면
        const promises = this.users.map(async (user_id) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user_id}:agreeNextAction`;
            const value = await redisClient.get(agreeNextActionKey);
            return value === "true";
        });

        const results = await Promise.all(promises);
        return results.every((agreed) => agreed);
    }

    public resetAgreeNextAction(): void {
        const promises = this.users.map((user_id) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user_id}:agreeNextAction`;
            return redisClient.del(agreeNextActionKey);
        });

        Promise.all(promises).catch((error) => {
            console.error("Error resetting agreeNextAction keys:", error);
        });
    }

    public async getUsersScore(): Promise<number[]> {
        // Fetch the scores of the current users
        // Create an array of promises to get the scores from Redis

        if (this.users.length === 0) return [];

        const promises = this.users.map(async (user_id) => {
            const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
            const score = await redisClient.get(userScoreKey);
            return parseInt(score || "0", 10);
        });

        const users_score = await Promise.all(promises);
        return users_score;
    }

    public isUserInRoom(user_id: number): boolean {
        // 유저가 있는지 확인
        return this.users.includes(user_id);
    }

    public checkUserCount(): boolean {
        // 인원수 문제 없는지 확인
        // 현재 유저들 가져옴
        // 1 < length < 8
        return this.users.length >= 1 && this.users.length <= 8;
    }

    public async addUser(user_id: number): Promise<void> {
        // 인원수 한 명 추가
        // score_key = f"session:{session_id}:user 에 user_id 추가
        if (this.isUserInRoom(user_id)) return;

        try {
            const userKey = `session:${this.session_id}:user:${user_id}`;
            await redisClient.set(userKey, user_id.toString(), { EX: 60 * 60 });

            this.users.push(user_id);
        } catch (error) {
            console.error(`Failed to add user ${user_id}:`, error);
        }
    }

    setUserScore(user_id: number, score: number) {
        // 유저 스코어 설정
        const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
        redisClient.set(userScoreKey, score.toString(), { EX: 60 * 60 });
    }

    public isRoomManager(user_id: number): boolean {
        // 유저가 방장인지 확인 index:0이면 방장
        return this.users.length > 0 && this.users[0] === user_id;
    }

    public async getSong(): Promise<string | null> {
        // 현재 노래 가져오기 "session:{session_id}:song"
        const songKey = `session:${this.session_id}:song`;
        return await redisClient.get(songKey);
    }

    public async updateCurrentSong(song_id: number): Promise<void> {
        // 현재 노래 설정 "session:{session_id}:song"
        const songKey = `session:${this.session_id}:song`;
        await redisClient.set(songKey, song_id.toString(), { EX: 60 * 5 });
    }

    public async deleteUser(user_id: number): Promise<void> {
        try {
            const userKey = `session:${this.session_id}:user:${user_id}`;
            await redisClient.del(userKey);

            this.users = this.users.filter((id) => id !== user_id);
        } catch (error) {
            console.error(`Failed to delete user ${user_id}:`, error);
        }
    }
}
