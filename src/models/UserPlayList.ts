import { Model, DataTypes } from "sequelize";
import { sequelize } from "../database";
import User from "./User"; // Assuming you have a User model
import PlayList from "./PlayList"; // Assuming you have a Playlist model

class UserPlaylist extends Model {
    public user_playlist_id!: number;
    public playlist_id!: number;
    public user_id!: number;
    public created_at!: Date;
}

UserPlaylist.init(
    {
        user_playlist_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        playlist_id: {
            type: DataTypes.INTEGER,
            references: {
                model: PlayList,
                key: "playlist_id",
            },
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: User,
                key: "user_id",
            },
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "user_playlist",
        timestamps: false,
    }
);

UserPlaylist.belongsTo(User, { foreignKey: "user_id" });
UserPlaylist.belongsTo(PlayList, { foreignKey: "playlist_id" });

export default UserPlaylist;
