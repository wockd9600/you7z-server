import { IsBoolean, IsEmail, IsUrl, IsNumber, IsOptional, IsNotEmpty, IsString, Length, Min, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Type } from "class-transformer";

class PlayListDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    download_count?: number;

    constructor() {
        this.id = undefined;
        this.title = "";
        this.description = "";
        this.length = 0;
        this.download_count = 0;
    }
}

class SongDto {
    @IsNotEmpty()
    @IsUrl()
    url: string;

    @IsNumber()
    start_time: number;

    @IsNotEmpty()
    @IsString()
    @Length(1, 128)
    answer: string;

    @IsNotEmpty()
    @IsString()
    @Length(0, 128)
    description: string;

    constructor() {
        this.url = "";
        this.start_time = 0;
        this.answer = "";
        this.description = "";
    }
}

class PlayListRequestDto {
    @IsNumber()
    @Min(0)
    public page: number;

    @IsOptional()
    @IsString()
    @Length(1, 25)
    public search_term: string;

    constructor(page: number, search_term?: string) {
        this.page = page;
        this.search_term = search_term ?? "";
    }
}

class PlayListResponseDto {
    public playlists: PlayListDto[];

    constructor(playlists: PlayListDto[]) {
        this.playlists = playlists;
    }
}

class ReferRequestDto {
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

export class PopularRequestDto extends PlayListRequestDto {}
export class PopularResponseDto extends PlayListResponseDto {}

export class SearchRequestDto extends PlayListRequestDto {}
export class SearchResponseDto extends PlayListResponseDto {}

export class StoreRequestDto extends ReferRequestDto {}
export class StoreResponseDto extends BooleanResponseDto {}

export class CreateRequestDto {
    @ValidateNested()
    @Type(() => PlayListDto)
    public playlist: PlayListDto;

    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => SongDto)
    public songs: SongDto[];

    constructor(playlist: PlayListDto, songs: SongDto[]) {
        this.playlist = playlist;
        this.songs = songs;
    }
}

export class CreateResponseDto extends BooleanResponseDto {}

export class DeleteRequestDto extends ReferRequestDto {}
export class DeleteResponseDto extends BooleanResponseDto {}

export class DeleteStoreRequestDto extends ReferRequestDto {}
export class DeleteStoreResponseDto extends BooleanResponseDto {}
