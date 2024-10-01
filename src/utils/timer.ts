export class RoomTimer {
    public static timers: { [roomCode: string]: NodeJS.Timeout } = {};

    public static startTimer(roomCode: string, duration: number, callback: () => void) {
        if (RoomTimer.timers[roomCode]) {
            clearTimeout(RoomTimer.timers[roomCode]); // 기존 타이머가 있으면 제거
        }
        RoomTimer.timers[roomCode] = setTimeout(() => {
            callback();
            delete RoomTimer.timers[roomCode]; // 타이머 종료 후 제거
        }, duration);
    }

    public static clearTimer(roomCode: string) {
        if (RoomTimer.timers[roomCode]) {
            clearTimeout(RoomTimer.timers[roomCode]);
            delete RoomTimer.timers[roomCode];
        }
    }
}

export class UserTimer {
    public static users: { [userId: string]: NodeJS.Timeout } = {};

    public static startTimer(userId: string, duration: number, callback: () => void) {
        if (RoomTimer.timers[userId]) {
            clearTimeout(RoomTimer.timers[userId]); // 기존 타이머가 있으면 제거
        }
        RoomTimer.timers[userId] = setTimeout(() => {
            callback();
            delete RoomTimer.timers[userId]; // 타이머 종료 후 제거
        }, duration);
    }

    public static clearTimer(userId: string) {
        if (RoomTimer.timers[userId]) {
            clearTimeout(RoomTimer.timers[userId]);
            delete RoomTimer.timers[userId];
        }
    }
}
