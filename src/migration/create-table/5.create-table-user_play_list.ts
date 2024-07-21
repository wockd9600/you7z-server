import UserPlayList from "../../models/UserPlayList";

console.log("======Create User Table======");

const create_table_user_playlist = async () => {
    await UserPlayList.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err) => {
            console.log(err);
        });
};

create_table_user_playlist();
