import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";

class User extends Model {
    public user_id!: number;
    public kakao_id!: string;
    public refresh_token!: string;
    public status!: number;
    public created_at!: Date;
}

User.init(
    {
        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        kakao_id: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 20],
            },
        },
        refresh_token: {
            type: DataTypes.STRING(64),
            validate: {
                notEmpty: true,
                len: [64, 64],
            },
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
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
        tableName: "user",
        timestamps: false,
    }
);

export default User;
