import { Request, Response } from 'express';
import autobind from 'autobind-decorator';


export default class ServiceController {
  @autobind
  login(req: Request, res: Response) {
    // 로그인 로직
  }

  @autobind
  logout(req: Request, res: Response) {
    // 로그아웃 로직
  }

  @autobind
  refresh(req: Request, res: Response) {
    // 토큰 재발급 로직
  }


  // 다른 메서드들...
}