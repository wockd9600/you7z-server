import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import User from "./User";

class Playlist extends Model {
    public playlist_id!: number;
    public user_id!: number;
    public title!: string;
    public description!: string;
    public length!: number;
    public download_count!: number;
    public status!: number;
    public created_at!: Date;
}

Playlist.init(
    {
        playlist_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: User,
                key: "user_id",
            },
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(45),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 45],
            },
        },
        description: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        length: {
            type: DataTypes.TINYINT,
            allowNull: true,
        },
        download_count: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
            allowNull: false,
        },
        status: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
            allowNull: false,
            validate: {
                isIn: [[0, 1]],
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
        tableName: "playlist",
        timestamps: false,
    }
);
