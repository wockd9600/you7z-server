import { Transaction } from "sequelize";
import IPlayListRepository from "../interfaces/playlist";

import PlayList from "../../models/PlayList";
import UserPlaylist from "../../models/UserPlayList";
import Song from "../../models/Song";

export default class PlayListRepository implements IPlayListRepository {
    getPopularPlaylists(page: number, per: number) {}
    getSearchPlaylists(page: number, search_term: string) {}
    findOneUserPlayList(user_playlist: UserPlaylist) {}

    createPlayList(playlist: PlayList, transaction: Transaction) {}
    createUserPlayList(user_playlist: UserPlaylist) {}
    bulkCreateSong(song: Song[], transaction: Transaction) {}

    updatePlayList(playlist: PlayList) {}

    deleteUserPlayList(user_playlist: UserPlaylist) {}
}
