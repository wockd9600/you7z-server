// import { Model, DataTypes } from "sequelize";
// import { sequelize } from "../database";
// import GameSession from "./GameSession";

// class Question extends Model {
//     public question_id!: number;
//     public session_id!: number;
//     public song_id!: number;
//     public created_at!: Date;
// }

// Question.init(
//     {
//         question_id: {
//             type: DataTypes.INTEGER,
//             autoIncrement: true,
//             primaryKey: true,
//         },
//         session_id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             references: {
//                 model: GameSession,
//                 key: "session_id",
//             },
//         },
//         song_id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//         },
//         created_at: {
//             type: DataTypes.DATE,
//             allowNull: false,
//             defaultValue: DataTypes.NOW,
//             validate: {
//                 isDate: true,
//             },
//         },
//     },
//     {
//         sequelize,
//         tableName: "question",
//         timestamps: false,
//     }
// );

// export default Question;
