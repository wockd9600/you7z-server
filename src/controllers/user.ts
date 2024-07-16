import { Request, Response } from 'express';
import autobind from 'autobind-decorator';


export default class UserController {
  @autobind
  patchName(req: Request, res: Response) {
    // 전달된 토큰에서 id를 추출
    // 전달된 텍스트 데이터로 이름 변경
  }

  // 다른 메서드들...
}