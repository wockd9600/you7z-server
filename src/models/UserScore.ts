import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import GameSession from "./GameSession";
import User from "./User"; // Assuming a User model exists

class UserScore extends Model {
    public score_id!: number;
    public session_id!: number;
    public user_id!: number;
    public score!: number;
    public created_at!: Date;
}

UserScore.init(
    {
        score_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        session_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: GameSession,
                key: "session_id",
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
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                max: 20,
                min: 0,
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
        tableName: "user_score",
        timestamps: false,
    }
);

export default UserScore;
