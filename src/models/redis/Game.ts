export class Game {
    constructor(public room_id: number, public song_id: number, public score: object) {}
}

//현재 유저들 score 가져옴
// 현재 유저들 가져옴
// for f"session:{session_id}:user:{user_id}:score"
// 저장

// 유저가 있는지 확인

// 인원수 문제 없는지 확인
// 현재 유저들 가져옴
// 1 < length < 8

// 인원수 한 명 추가
// score_key = f"session:{session_id}:user 에 user_id 추가
// score_key = f"session:{session_id}:user:{user_id}:score"
// score = 0

// 유저 스코어 설정

// 현재 유저들 가져옴
// f"session:{session_id}:user"

// 유저 삭제
// f"session:{session_id}:user"
// delete user_id

// 유저가 방장인지 확인
// f"session:{session_id}:user"
// index:0이면 방장

// 현재 노래 가져오기
// f"session:{session_id}:song"
// 현재 노래 설정
// f"session:{session_id}:song"