import { Transaction } from "sequelize";
import Playlist from "../../models/Playlist";
import UserPlaylist from "../../models/UserPlaylist";
import Song from "../../models/Song";

export default interface IPlaylistRepository {
    getPopularPlaylists(limit: number, offset: number): Promise<Playlist[]>;
    getSearchPlaylists(limit: number, offset: number, search_term: string): Promise<Playlist[]>;
    findOnePlaylist(playlist: Playlist): Promise<Playlist | null>;
    findOneUserPlaylist(user_playlist: UserPlaylist): Promise<UserPlaylist | null>;

    createPlaylist(playlist: Playlist, transaction?: Transaction | null): Promise<Playlist>;
    createUserPlaylist(user_playlist: UserPlaylist): Promise<UserPlaylist>;
    bulkCreateSong(songs: Partial<Song>[], transaction?: Transaction | null): Promise<void>;

    updateDeletePlaylist(playlist: Playlist): Promise<void>;
    updateAddDownloadCountPlayllist(playlist: Playlist): Promise<void>;

    deleteUserPlaylist(user_playlist: UserPlaylist): Promise<void>;
}
