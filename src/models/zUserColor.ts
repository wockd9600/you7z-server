// import { Model, DataTypes } from "sequelize";
// import { sequelize } from "../database";
// import GameRoom from "./GameRoom";
// import User from "./User";

// class UserColor extends Model {
//     public color_id!: number;
//     public room_id!: number;
//     public user_id!: number;
//     public join_order!: number;
//     public color!: number;
//     public created_at!: Date;
// }

// UserColor.init(
//     {
//         color_id: {
//             type: DataTypes.INTEGER,
//             autoIncrement: true,
//             primaryKey: true,
//         },
//         room_id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             references: {
//                 model: GameRoom,
//                 key: "room_id",
//             },
//         },
//         user_id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             references: {
//                 model: User,
//                 key: "user_id",
//             },
//         },
//         join_order: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             validate: {
//                 min: 0,
//                 max: 6,
//             },
//         },
//         color: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             validate: {
//                 min: 0,
//                 max: 6,
//             },
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
//         tableName: "user_color",
//         timestamps: false,
//     }
// );

// export default UserColor;
