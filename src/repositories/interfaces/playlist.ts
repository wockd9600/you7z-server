import { Transaction } from "sequelize";
import PlayList from "../../models/PlayList";
import UserPlaylist from "../../models/UserPlayList";
import Song from "../../models/Song";

export default interface IPlayListRepository {
    getPopularPlaylists(page: number, per: number): Promise<PlayList[]>;
    getSearchPlaylists(page: number, search_term: string): Promise<PlayList[]>;
    findOneUserPlayList(user_playlist: UserPlaylist): Promise<UserPlaylist | null>;

    createPlayList(playlist: PlayList, transaction: Transaction): Promise<PlayList>;
    createUserPlayList(user_playlist: UserPlaylist): Promise<UserPlaylist>;
    bulkCreateSong(song: Song[], transaction: Transaction): Promise<Song[]>;

    updatePlayList(playlist: PlayList): Promise<void>;

    deleteUserPlayList(user_playlist: UserPlaylist): Promise<void>;
}
