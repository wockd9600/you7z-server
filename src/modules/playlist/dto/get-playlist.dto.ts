import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetPlaylistQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ?? 1, { toClassOnly: true })
  page: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ?? 0, { toClassOnly: true })
  type: number;

  @IsOptional()
  @Transform(({ value }) => value ?? '', { toClassOnly: true })
  search_term: string;
}
