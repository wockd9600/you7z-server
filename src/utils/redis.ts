import redisClient from "../modules/redis-client";

export default async function createRedisUtil(session_id: number): Promise<RedisUtil> {
    const redisUtil = new RedisUtil(session_id);
    await redisUtil.initialize();
    return redisUtil;
}

type RedisUser = { user_id: number; order: number };

export class RedisUtil {
    public session_id: number;
    public users: RedisUser[] = [];

    constructor(session_id: number) {
        this.session_id = session_id;
    }

    static async getUserOtherSessionId(user_id: number): Promise<number> {
        try {
            const pattern = `session:*:user:${user_id}`;
            const keys = await redisClient.keys(pattern);

            if (keys.length === 0) return -1;

            return parseInt(keys[0].split(":")[1], 10);
        } catch (error) {
            throw error;
        }
    }

    // static async deleteUserInOtherRoom(session_id: number, user_id: number): Promise<void> {
    //     try {
    //         const key = `session:${session_id}:user:${user_id}`;
    //         await redisClient.del(key);
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    public async initialize(): Promise<void> {
        // 현재 유저들 가져옴 "session:{session_id}:user"
        try {
            const pattern = `session:${this.session_id}:user:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length === 0) return;

            const filteredKeys = keys.filter((key) => /^session:\d+:user:\d+$/.test(key));

            const users = await Promise.all(
                filteredKeys.map(async (key) => {
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
        const result = this.users.some((user) => user.user_id === user_id);
        return result;
    }

    public async getConnectedUsers(): Promise<RedisUser[]> {
        const users = await Promise.all(
            this.users.map(async (user) => {
                const status = await this.getUserStatus(user.user_id);
                return { user, status };
            })
        );

        return users.filter(({ status }) => status !== -1).map(({ user }) => user);
    }

    public async isStart(): Promise<boolean> {
        const connectedUsers = await this.getConnectedUsers();
        return connectedUsers.length >= 2 && connectedUsers.length <= 8;
    }

    public checkUserCount(min: number): boolean {
        // 인원수 문제 없는지 확인
        // 현재 유저들 가져옴
        // 1 < length < 8
        return this.users.length >= min && this.users.length <= 8;
    }

    // get
    public getUsers() {
        this.users.sort((a, b) => a.order - b.order);
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

    public async getUserScore(user_id: number) {
        const key = `session:${this.session_id}:user:${user_id}:score`;
        const score = await redisClient.get(key);
        return parseInt(score || "0", 10);
    }

    public async getUserStatus(user_id: number) {
        const key = `session:${this.session_id}:user:${user_id}:status`;
        const score = await redisClient.get(key);
        return parseInt(score || "0", 10);
    }

    public async getAgreeNextAction(user_id: number) {
        const key = `session:${this.session_id}:user:${user_id}:agreeNextAction`;
        const value = await redisClient.get(key);
        return value;
    }

    public async isALLAgreeNextAction(): Promise<boolean> {
        // 유저들의 동영상 로딩이 전부 준비 되면
        const connectedUsers = await this.getConnectedUsers();
        const promises = connectedUsers.map(async (user) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user.user_id}:agreeNextAction`;
            const value = await redisClient.get(agreeNextActionKey);
            return value === "true";
        });

        const results = await Promise.all(promises);
        return results.every((agreed) => agreed);
    }

    public async getDisagreeUsersNextAction(): Promise<number[]> {
        const connectedUsers = await this.getConnectedUsers();
        const promises = connectedUsers.map(async (user) => {
            const agreeNextActionKey = `session:${this.session_id}:user:${user.user_id}:agreeNextAction`;
            const value = await redisClient.get(agreeNextActionKey);
            return { ...user, agree: value || "false" };
        });
        const results = await Promise.all(promises);
        return results.filter((user) => user.agree !== "true").map((user) => user.user_id);
    }

    public async isALLUserStatus(): Promise<boolean> {
        // 유저들의 동영상 로딩이 전부 준비 되면
        const connectedUsers = await this.getConnectedUsers();
        const promises = connectedUsers.map(async (user) => {
            const key = `session:${this.session_id}:user:${user.user_id}:status`;
            const value = await redisClient.get(key);
            return value === "-1";
        });

        const results = await Promise.all(promises);
        return results.every((agreed) => agreed);
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

    public async getAnswerUserId(): Promise<number> {
        // 현재 노래 가져오기 "session:{session_id}:song"
        try {
            const answer_key = `session:${this.session_id}:answer`;
            const answer_user_id = await redisClient.get(answer_key);

            return answer_user_id ? parseInt(answer_user_id, 10) : 0;
        } catch (error) {
            throw error;
        }
    }

    public async getPossibleAnswer(): Promise<boolean> {
        // 현재 노래 가져오기 "session:{session_id}:song"
        try {
            const possible_key = `session:${this.session_id}:possible`;
            const isPossible = await redisClient.get(possible_key);

            return isPossible === "true";
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
            this.users.sort((a, b) => a.order - b.order);

            let order = 0;
            if (this.users.length !== 0) {
                const index = this.users.length - 1;
                order = this.users[index].order + 1;
            }

            const userKey = `session:${this.session_id}:user:${user_id}`;
            await redisClient.set(userKey, JSON.stringify({ user_id, order }), { EX: 60 * 60 });

            await this.setUserScore(user_id, 0);
            await this.setUserStatus(user_id, 0);

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

    public async setAgreeNextAction(user_id: number): Promise<void> {
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

    public async setUserStatus(user_id: number, status: 0 | -1) {
        // 유저 스코어 설정
        try {
            const userStatuseKey = `session:${this.session_id}:user:${user_id}:status`;
            await redisClient.set(userStatuseKey, status.toString(), { EX: 60 * 60 });
        } catch (error) {
            throw error;
        }
    }

    public async setCurrentSongId(song_id: number): Promise<void> {
        // 현재 노래 설정 "session:{session_id}:song"
        const song_key = `session:${this.session_id}:song`;
        await redisClient.set(song_key, song_id.toString(), { EX: 60 * 10 });
    }

    public async setAnswerUserId(answer_user_id: number): Promise<void> {
        // 현재 노래 설정 "session:{session_id}:song"
        const answer_key = `session:${this.session_id}:answer`;
        await redisClient.set(answer_key, answer_user_id.toString(), { EX: 60 * 10 });
    }

    public async setPossibleAnswer(value: boolean): Promise<void> {
        const possible_key = `session:${this.session_id}:possible`;
        await redisClient.set(possible_key, value.toString(), { EX: 60 * 60 });
    }

    // delete
    public async deleteRoom() {
        try {
            this.resetAgreeNextAction();
            this.deleteAnswerUserId();
            this.deleteSong();

            await Promise.all(this.users.map((user) => this.deleteUser(user.user_id)));
        } catch (error) {
            throw error;
        }
    }

    public async resetAgreeNextAction() {
        try {
            const promises = this.users.map((user) => {
                const agreeNextActionKey = `session:${this.session_id}:user:${user.user_id}:agreeNextAction`;
                return redisClient.del(agreeNextActionKey);
            });

            await Promise.all(promises);
        } catch (error) {
            throw error;
        }
    }

    public async deleteUser(user_id: number): Promise<void> {
        try {
            const userKey = `session:${this.session_id}:user:${user_id}`;
            const userScoreKey = `session:${this.session_id}:user:${user_id}:score`;
            const userStatusKey = `session:${this.session_id}:user:${user_id}:status`;

            // 병렬로 Redis 키 삭제
            await Promise.all([redisClient.del(userKey), redisClient.del(userScoreKey), redisClient.del(userStatusKey)]);

            // 유저 목록 필터링
            this.users = this.users.filter((user) => user.user_id !== user_id);
        } catch (error) {
            console.error(`Failed to delete user ${user_id}:`, error);
            throw error;
        }
    }

    public async deleteUserScore(user_id: number) {
        try {
            const key = `session:${this.session_id}:user:${user_id}:score`;
            await redisClient.del(key);
        } catch (error) {
            throw error;
        }
    }

    public async deleteUserStatus(user_id: number) {
        try {
            const key = `session:${this.session_id}:user:${user_id}:status`;
            await redisClient.del(key);
        } catch (error) {
            throw error;
        }
    }

    public async deleteAnswerUserId() {
        const key = `session:${this.session_id}:answer`;
        await redisClient.del(key);
    }

    public async deleteSong() {
        const key = `session:${this.session_id}:song`;
        await redisClient.del(key);
    }
}
