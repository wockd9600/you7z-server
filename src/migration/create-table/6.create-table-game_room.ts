import GameRoom from "../../models/GameRoom";

console.log("======Create User Table======");

const create_table_game_room = async () => {
    await GameRoom.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err: any) => {
            console.log(err);
        });
};

create_table_game_room();
