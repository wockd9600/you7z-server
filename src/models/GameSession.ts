import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import GameRoom from "./GameRoom";
import Playlist from "./Playlist"; // Assuming you have a Playlist model
import User from "./User";

class GameSession extends Model {
    public session_id!: number;
    public room_id!: number;
    public user_id!: number;
    public playlist_id!: number;
    public question_order!: string;
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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
        },
        playlist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Playlist,
                key: "playlist_id",
            },
        },
        question_order: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        game_type: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1,
            validate: {
                isIn: [[0, 1]], // [1s, full]
            },
        },
        goal_score: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            validate: {
                max: 255,
                min: 5,
            },
            defaultValue: 255,
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
        timestamps: false,
    }
);

export default GameSession;
