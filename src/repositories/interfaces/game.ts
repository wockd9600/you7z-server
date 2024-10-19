import { Transaction } from "sequelize";
import GameRoom from "../../models/GameRoom";
import GameSession from "../../models/GameSession";
import Playlist from "../../models/Playlist";
import Song from "../../models/Song";
// import UserPlaylist from "../../models/zUserPlaylist";
import UserProfile from "../../models/UserProfile";

export default interface IGameRepository {
    findOneGameRoom(gameRoomData: GameRoom): Promise<GameRoom | null>;
    findOneGameSession(gameRoomData: GameRoom | GameSession): Promise<GameSession | null>;
    findOnePlayList(playlistData: Playlist): Promise<Playlist | null>;
    // findOneUserPlayList(userPlaylistData: UserPlaylist): Promise<UserPlaylist | null>;
    findOneSong(songData: Song): Promise<Song | null>;
    findAllSong(gameRoomData: GameSession): Promise<Song[]>;
    findAllUserName(user_ids: number[]): Promise<UserProfile[]>;

    createGameRoom(gameRoomData: GameRoom, transaction?: Transaction | null): Promise<GameRoom>;
    createGameSession(gameRoomData: GameSession, transaction?: Transaction | null): Promise<GameSession>;

    updateGameRoom(gameRoomData: GameRoom): Promise<void>;
    updateGameSession(gameRoomData: GameSession, transaction?: Transaction | null): Promise<void>;
}
