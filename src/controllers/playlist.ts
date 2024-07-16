import { Request, Response } from "express";
import autobind from "autobind-decorator";

export default class PlaylistController {
    @autobind
    getPopularPlayList(req: Request, res: Response) {
        // page를 전달 받음.
        // page에 해당하는 인기 노래모음을 가져옴 (is_delete = 0)
        // 전달
    }

    @autobind
    getSearchPlayList(req: Request, res: Response) {
        // 검색어를 전달 받아서
        // 노래모음에서 검색 (is_delete = 0)
        // 해당하는 노래가 있으면 전달
    }

    @autobind
    postStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 저장
    }

    @autobind
    postCreatePlayList(req: Request, res: Response) {
        // user id, playlist와 song list를 전달 받음.
        // playlist 생성
        // songlist 생성
        // 완성 전달
    }

    // @autobind
    // postAddSong(req: Request, res: Response) {}

    // @autobind
    // patchDeleteSong(req: Request, res: Response) {}

    @autobind
    patchDeletePlayList(req: Request, res: Response) {
        // user id, playlist id를 전달 받음.
        // playlist가 user가 만든건지 확인함.
        // playlist의 is_delete = 1로 변경
    }

    @autobind
    deleteStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 삭제
    }

    // 다른 메서드들...
}
