import redisClient from "../modules/redis-client";

export default async function createRedisUtil(session_id: number): Promise<RedisUtil> {
    const redisUtil = new RedisUtil(session_id);
    await redisUtil.initialize();
    return redisUtil;
}

export class RedisUtil {
    public session_id: number;
    public users: { user_id: number; order: number }[] = [];

    constructor(session_id: number) {
        this.session_id = session_id;
    }

    static async getUserOtherSessionId(user_id: number): Promise<number> {
        try {
            const pattern = `session:*:user:${user_id}`;
            const keys = await redisClient.keys(pattern);

            return parseInt(keys[0].split(":")[1], 10);
        } catch (error) {
            throw error;
        }
    }

    static async deleteUserInOtherRoom(session_id: number, user_id: number): Promise<void> {
        try {
            const key = `session:${session_id}:user:${user_id}`;
            await redisClient.del(key);
        } catch (error) {
            throw error;
        }
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
                        const user = JSON.parse(userData);
                        return user;
                    }
                    return null;
                })
            );

            this.users = users.filter((user) => user !== null);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }


    // check
    public isUserInRoom(user_id: number): boolean {
        // 유저가 있는지 확인
        const result = this.users.some((user) => user_id in user);
        return result;
    }

    public checkUserCount(): boolean {
        // 인원수 문제 없는지 확인
        // 현재 유저들 가져옴
        // 1 < length < 8
        return this.users.length >= 1 && this.users.length <= 8;
    }

    // get
    public getUsers() {
        return this.users;
    }

    public async getUsersScore() {
        // Fetch the scores of the current users
        // Create an array of promises to get the scores from Redis

        if (this.users.length === 0) return [];

        const promises = this.users.map(async (user) => {
            const userScoreKey = `session:${this.session_id}:user:${user.user_id}:score`;
            const score = await redisClient.get(userScoreKey);
            return { user_id: user.user_id, score: parseInt(score || "0", 10) };
        });

        const users_score = await Promise.all(promises);
        return users_score;
    }

    public async isALLAgreeNextAction(): Promise<boolean> {
        // 유저들의 동영상 로딩이 전부 준비 되면
        const promises = this.users.map(async (user) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user.user_id}:agreeNextAction`;
            const value = await redisClient.get(agreeNextActionKey);
            return value === "true";
        });

        const results = await Promise.all(promises);
        return results.every((agreed) => agreed);
    }

    public async getRoomMangerId(): Promise<number | null> {
        try {
            const userKey = `session:${this.session_id}:manager`;
            const manager_id = await redisClient.get(userKey);

            return manager_id ? parseInt(manager_id, 10) : 0;
        } catch (error) {
            throw error;
        }
    }

    public async getCurrentSongId(): Promise<number> {
        // 현재 노래 가져오기 "session:{session_id}:song"
        try {
            const song_key = `session:${this.session_id}:song`;
            const somg_id = await redisClient.get(song_key);

            return somg_id ? parseInt(somg_id, 10) : 0;
        } catch (error) {
            throw error;
        }
    }

    // set
    public async addUser(user_id: number): Promise<void> {
        // 인원수 한 명 추가
        // score_key = f"session:{session_id}:user 에 user_id 추가
        if (this.isUserInRoom(user_id)) return;

        try {
            const order = this.users.length;
            const userKey = `session:${this.session_id}:user:${user_id}`;
            await redisClient.set(userKey, { user_id, order }.toString(), { EX: 60 * 60 });

            await this.setUserScore(user_id, 0);

            const pattern = `session:${this.session_id}:user:*`;
            const keys = await redisClient.keys(pattern);

            if (keys.length > 8) {
                this.deleteUser(user_id);
                throw new Error("가득찬 방입니다.");
            }

            this.users.push({ user_id, order });
        } catch (error) {
            console.error(`Failed to add user ${user_id}:`, error);
            throw error;
        }
    }

    public async agreeNextAction(user_id: number): Promise<void> {
        // 플레이 준비 완료
        const agreeNextActionKey = `session:${this.session_id}:user:${user_id}:agreeNextAction`;
        await redisClient.set(agreeNextActionKey, "true", { EX: 60 * 60 });
    }

    public async setUserScore(user_id: number, score: number) {
        // 유저 스코어 설정
        try {
            const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
            await redisClient.set(userScoreKey, score.toString(), { EX: 60 * 60 });
        } catch (error) {
            throw error;
        }
    }

    public async setRoomManager(user_id: number): Promise<void> {
        try {
            // 유저가 방장인지 확인 index:0이면 방장
            const userKey = `session:${this.session_id}:manager`;
            await redisClient.set(userKey, user_id.toString(), { EX: 60 * 60 });
        } catch (error) {
            throw error;
        }
    }

    public async setCurrentSongId(song_id: number): Promise<void> {
        // 현재 노래 설정 "session:{session_id}:song"
        const song_key = `session:${this.session_id}:song`;
        await redisClient.set(song_key, song_id.toString(), { EX: 60 * 5 });
    }

    // delete
    public async deleteRoomManger(): Promise<void> {
        try {
            const userKey = `session:${this.session_id}:manager`;
            await redisClient.del(userKey);
        } catch (error) {
            throw error;
        }
    }

    public resetAgreeNextAction(): void {
        const promises = this.users.map((user) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user.user_id}:agreeNextAction`;
            return redisClient.del(agreeNextActionKey);
        });

        Promise.all(promises).catch((error) => {
            console.error("Error resetting agreeNextAction keys:", error);
        });
    }

    public async deleteUser(user_id: number): Promise<void> {
        try {
            const userKey = `session:${this.session_id}:user:${user_id}`;
            await redisClient.del(userKey);
            
            const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
            await redisClient.del(userScoreKey);
            
            this.users = this.users.filter((user) => user.user_id !== user_id);
        } catch (error) {
            console.error(`Failed to delete user ${user_id}:`, error);
            throw error;
        }
    }
}
