import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import User from "./User";

class UserProfile extends Model {
    public profile_id!: number;
    public user_id!: number;
    public nickname!: string;
    public created_at!: Date;
}

UserProfile.init(
    {
        profile_id: {
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
        nickname: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 20],
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
        tableName: "user_profile",
        timestamps: false,
    }
);

export default UserProfile;
