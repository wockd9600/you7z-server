import GameSession from "../../models/GameSession";

console.log("======Create User Table======");

const create_table_game_session = async () => {
    await GameSession.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err: any) => {
            console.log(err);
        });
};

create_table_game_session();
