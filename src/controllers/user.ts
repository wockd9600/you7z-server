import { Request, Response } from 'express';
import autobind from 'autobind-decorator';


export default class UserController {
  @autobind
  patchName(req: Request, res: Response) {
    // 로그인 로직
  }

  // 다른 메서드들...
}