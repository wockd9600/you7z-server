export class RepositoryError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'RepositoryError';
        Object.setPrototypeOf(this, new.target.prototype); // TypeScript에서 에러 클래스 상속 설정
    }
}