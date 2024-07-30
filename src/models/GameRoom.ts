import { Model, DataTypes } from "sequelize";
import { sequelize } from "../modules/sequelize";

class GameRoom extends Model {
    public room_id!: number;
    public room_code!: string;
    public status!: number;
    public created_at!: Date;
}

GameRoom.init(
    {
        room_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        room_code: {
            type: DataTypes.STRING(16),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 16],
            },
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
        tableName: "game_room",
        timestamps: true,
    }
);

export default GameRoom;
