import PlayList from "../../models/Playlist";

console.log("======Create User Table======");

const create_table_playlist = async () => {
    await PlayList.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err) => {
            console.log(err);
        });
};

create_table_playlist();
