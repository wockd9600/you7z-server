import { Request, Response } from 'express';
import autobind from 'autobind-decorator';


export default class PlaylistController {
  @autobind
  getPopularPlayList(req: Request, res: Response) {
    // 로그인 로직
  }

  @autobind
  getSearchPlayList(req: Request, res: Response) {
    // 로그인 로직
  }


  @autobind
  postStorePlayList(req: Request, res: Response) {
    // 로그인 로직
  }

  @autobind
  postCreatePlayList(req: Request, res: Response) {
    // 로그인 로직
  }

  @autobind
  postAddSong(req: Request, res: Response) {
    // 로그인 로직
  }

  
  @autobind
  patchDeleteSong(req: Request, res: Response) {
    // 로그인 로직
  }

  @autobind
  patchDeletePlayList(req: Request, res: Response) {
    // 로그인 로직
  }


  @autobind
  deleteStorePlayList(req: Request, res: Response) {
    // 로그인 로직
  }



  // 다른 메서드들...
}