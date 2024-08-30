import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";
import GameSession from "./GameSession";
import User from "./User";

class Answer extends Model {
    public answer_id!: number;
    public session_id!: number;
    public user_id!: number;
    public content!: string;
    public is_alert!: number;
    public created_at!: Date;
}

Answer.init(
    {
        answer_id: {
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
        content: {
            type: DataTypes.STRING(64),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 64],
            },
        },
        is_alert: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
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
        tableName: "user_answer",
        timestamps: false,
    }
);

export default Answer;
