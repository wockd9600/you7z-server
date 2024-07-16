import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

export default class UserController {
    @autobind
    submitAnswer(io: Namespace, socket: Socket) {
        // user id, room_code, answer을 받음.
        // room_code로 session_table row 가져옴
        // (redis) 유저가 있는지 확인
        // answer 테이블에 작성
        // --- 게임이 시작했으면 ---
        // (redis) 현재 노래 가져오기
        // song_id로 url, 등등 가져옴
        // answer이랑 비교해서 정답인지 확인
        // ----- 정답이면 -----
        // (redis) 현재 노래 설정 (맞출 수 없는 답)
        // (redis) 유저 스코어 설정
        // 정답 유저 점수 emit
        // session 테이블의 playlist id로 플레이리스트 가져옴.
        // 랜덤으로 하나 뽑은 뒤
        // (redis) 현재 노래 설정
        // 방에 있는 사람들에게 emit
    }

    // 다른 메서드들...
}
