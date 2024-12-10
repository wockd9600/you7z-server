// 참고
// https://velog.io/@intellik/NestJS-효과적인-예외-핸들링

export class ErrorCodeVo {
  readonly status: number;
  readonly message: string;

  constructor(status: number, message: string) {
    this.status = status;
    this.message = message;
  }
}

export type ErrorCode = ErrorCodeVo;
export const ENTITY_NOT_FOUND = new ErrorCodeVo(404, 'Entity Not Found');
