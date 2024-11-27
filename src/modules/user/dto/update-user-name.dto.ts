import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateUserNameDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 15)
  nickname: string;
}
