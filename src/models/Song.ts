import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import Playlist from "./Playlist"; // Assuming you have a Playlist model

class Song extends Model {
    public song_id!: number;
    public playlist_id!: number;
    public url!: string;
    public start_time!: string;
    public answer!: string;
    public description!: string;
    public pass_count!: number;
    public created_at!: Date;
    public is_delete!: number;
}

Song.init(
    {
        song_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        playlist_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Playlist,
                key: "playlist_id",
            },
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
        start_time: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        answer: {
            type: DataTypes.STRING(128),
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(128),
            allowNull: true,
        },
        pass_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            validate: {
                isDate: true,
            },
        },
        is_delete: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isIn: [[0, 1]],
            },
        },
    },
    {
        sequelize,
        tableName: "song",
        timestamps: false,
    }
);

export default Song;
