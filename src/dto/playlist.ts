import { IsBoolean, IsUrl, IsNumber, IsOptional, IsNotEmpty, IsString, Length, Min, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Type, Expose } from "class-transformer";

import Playlist from "../models/Playlist";

export class PlayListDto {
    @Expose()
    @IsOptional()
    @IsNumber()
    id: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    title: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    description: string;

    @Expose()
    @IsOptional()
    @IsNumber()
    length: number;

    @Expose()
    @IsOptional()
    @IsNumber()
    score: number;

    @Expose()
    @IsOptional()
    @IsNumber()
    downloaded: number;

    constructor({ playlist_id, title, description, length, download_count }: Playlist, downloaded: number) {
        this.id = playlist_id;
        this.title = title;
        this.description = description;
        this.length = length;
        this.score = download_count;
        this.downloaded = downloaded;
    }
}

class SongDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    youtubeLink: string;

    @Expose()
    @IsString()
    startTime: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Length(1, 128)
    answer: string;

    @Expose()
    @IsOptional()
    @IsString()
    @Length(0, 128)
    description: string;
}

class PlayListRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    public page: number;

    @Expose()
    @IsOptional()
    @IsString()
    @Length(1, 25)
    public search_term?: string;

    constructor(page: number, search_term?: string) {
        this.page = page;
        this.search_term = search_term ?? "";
    }
}

class PlayListResponseDto {
    public playlists: Partial<PlayListDto>[];

    constructor(playlists: Partial<PlayListDto>[]) {
        this.playlists = playlists;
    }
}

class ReferRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    public id: number;

    constructor(id: number) {
        this.id = id;
    }
}

class BooleanResponseDto {
    @IsBoolean()
    public result: boolean;

    constructor(result: boolean) {
        this.result = result;
    }
}

export class PopularResponseDto extends PlayListResponseDto {}

export class SearchRequestDto extends PlayListRequestDto {}
export class SearchResponseDto extends PlayListResponseDto {}

export class StoreRequestDto extends ReferRequestDto {}
export class StoreResponseDto extends BooleanResponseDto {}

export class CreateRequestDto {
    @Expose()
    @ValidateNested()
    @Type(() => PlayListDto)
    public playlist: PlayListDto;

    @Expose()
    @IsArray()
    @ArrayMinSize(5)
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => SongDto)
    public songs: SongDto[];
}

export class CreateResponseDto extends BooleanResponseDto {}

export class CheckYoutubeLinkRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsUrl()
    public url: string;
}

export class CheckYoutubeLinkResponseDto {
    @Expose()
    @IsNotEmpty()
    @IsUrl()
    public title: string;
    public thumbnails: string;
    public duration: string;
}

export class DeleteRequestDto extends ReferRequestDto {}
export class DeleteResponseDto extends BooleanResponseDto {}

export class DeleteStoreResponseDto extends BooleanResponseDto {}
