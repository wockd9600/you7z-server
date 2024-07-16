import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

export default class GameController {
    @autobind
    startGame(io: Namespace, socket: Socket) {
        // room_code로 session_table row 가져옴
        // (redis) 방장인지 확인
        // (redis) 인원수 문제 없는지 확인
        // 게임 시작
        // session table status = 1 emit
        // (redis) 현재 유저들 가져옴
        // UserScore table 생성
        // session 테이블의 playlist id로 플레이리스트 가져옴.
        // 랜덤으로 하나 뽑은 뒤
        // (redis) 현재 노래 설정
        // 노래 url을 방에 있는 사람에게 전부 전달 emit
    }

    @autobind
    playSong(io: Namespace, socket: Socket) {
        // room_code로 session_table row 가져옴
        // (redis) 플레이 준비 완료
        // (redis) 유저들의 동영상 로딩이 전부 준비 되면
        // (redis) 준비 완료 초기화
        // 노래 재생! emit
    }

    // 다시 플레이도 있어야 한다.

    @autobind
    kickUser(io: Namespace, socket: Socket) {
        // user id와 kick할 user id를 가져와서
        // 시작한 방인지 확인함.
        // 게임 중이면 강퇴x
        // (redis) 유저가 방장인지 확인
        // (redis) 유저가 있는지 확인
        // (redis) 유저 삭제
        // 방의 유저들에게 알려줌. 해당 유저는 방에서 강퇴 emit
    }

    @autobind
    updateRoomSettings(io: Namespace, socket: Socket) {
        // user id와 game code, 변경할 key, value를 받는다.
        // 시작한 방인지 확인함.
        // (redis) 유저가 방장인지 확인
        // 변경할 설정을 적용한다.
        // 방에 있는 사람들에게 전달 emit
    }

    @autobind
    changeUserName(io: Namespace, socket: Socket) {
        // user id를 통해서 user name을 가져온다.
        // 방에 있는 사람들에게 user name을 보낸다. emit
    }

    @autobind
    leaveRoom(io: Namespace, socket: Socket) {
        // user id와 code를 받는다.
        // 시작한 방인지 확인함.
        // 시작했으면 나갈 수 없음.
        // (redis) 현재 유저들 가져옴
        // 1명이면 방을 삭제함
        // 여러명이면 나감. (프론트에서는 나갔을 때 들어온 id 순서대로 다시 정리하면 됨.) emit
    }

    // 다른 메서드들...
}
