import { Transaction } from "sequelize";
import Playlist from "../../models/Playlist";
import UserPlaylist from "../../models/UserPlaylist";
import Song from "../../models/Song";

export default interface IPlaylistRepository {
    getPlaylists(limit: number, offset: number, user_id: number, type: number, search_term?: string | undefined): Promise<Playlist[]>;
    // getSearchPlaylists(limit: number, offset: number, search_term: string): Promise<Playlist[]>;
    findOnePlaylist(playlist: Playlist): Promise<Playlist | null>;
    findOneUserPlaylist(user_playlist: UserPlaylist): Promise<UserPlaylist | null>;

    createPlaylist(playlist: Playlist, transaction?: Transaction | null): Promise<Playlist>;
    createUserPlaylist(user_playlist: UserPlaylist, transaction?: Transaction): Promise<UserPlaylist>;
    bulkCreateSong(songs: Partial<Song>[], transaction?: Transaction | null): Promise<void>;

    updateDeletePlaylist(playlist: Playlist): Promise<void>;
    increaseDownloadCountPlayllist(playlist: Playlist): Promise<void>;
    decreaseDownloadCountPlayllist(playlist: Playlist): Promise<void>;

    deleteUserPlaylist(user_playlist: UserPlaylist): Promise<void>;
}
