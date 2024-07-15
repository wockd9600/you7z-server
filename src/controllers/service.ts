import { Request, Response } from 'express';
import autobind from 'autobind-decorator';


export default class ServiceController {
  @autobind
  login(req: Request, res: Response) {
    // 로그인 로직
    // kakao api를 이용해서 kakao id number를 가져오고 
    // 아이디가 있으면 로그인
    // 없으면 회원가입
    // user, userPfoile table에 로우 생성
    // create refresh token, status = 1, nickname = random
  }

  @autobind
  logout(req: Request, res: Response) {
    // 로그아웃 로직
    // 전달된 토큰에서 id를 추출
    // delete refresh token, 입장 중인 방 있으면 퇴장
  }

  @autobind
  refresh(req: Request, res: Response) {
    // 전달된 토큰에서 id를 추출
    // 토큰 재발급 로직
  }


  // 다른 메서드들...
}