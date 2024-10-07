import Song from "../../models/Song";

console.log("======Create User Table======");

const create_table_song = async () => {
    await Song.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err: any) => {
            console.log(err);
        });
};

create_table_song();
