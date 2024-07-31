import { IsArray, IsNotEmpty, IsString, Length } from "class-validator";
import Answer from "../models/Answer";

export class AnswerRequestDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    public room_code: string;

    constructor(room_code: string) {
        this.room_code = room_code;
    }
}

export class AnswerResponseDto {
    @IsNotEmpty()
    @IsArray()
    public answers: Answer[];

    constructor(answers: Answer[]) {
        this.answers = answers;
    }
}
