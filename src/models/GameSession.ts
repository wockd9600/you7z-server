import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import GameRoom from "./GameRoom";
import PlayList from "./Playlist"; // Assuming you have a Playlist model

class GameSession extends Model {
    public session_id!: number;
    public room_id!: string;
    public playlist_id!: number;
    public game_type!: number;
    public goal_score!: number;
    public status!: number;
    public created_at!: Date;
}

GameSession.init(
    {
        session_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: GameRoom,
                key: "room_id",
            },
        },
        playlist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: PlayList,
                key: "playlist_id",
            },
        },
        game_type: {
            type: DataTypes.TINYINT,
            allowNull: false,
            validate: {
                isIn: [[0, 1]], // [1s, full]
            },
        },
        goal_score: {
            type: DataTypes.TINYINT,
            allowNull: false,
            validate: {
                max: 20,
                min: 5,
            },
            defaultValue: 10,
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isIn: [[0, 1]], // Only allows values 0 and 1
            },
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            validate: {
                isDate: true,
            },
        },
    },
    {
        sequelize,
        tableName: "game_session",
        timestamps: true,
    }
);

export default GameSession;
