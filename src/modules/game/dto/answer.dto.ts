export class GameAnswerDto {
  id?: number;
  userId?: number;
  message?: string;
  isAlert?: number;
  constructor({ answerId, userId, content, isAlert }) {
    this.id = answerId;
    this.userId = userId;
    this.message = content;
    this.isAlert = isAlert;
  }
}
