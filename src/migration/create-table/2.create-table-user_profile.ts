import UserProfile from "../../models/UserProfile";

console.log("======Create User Table======");

const create_table_user_profile = async () => {
    await UserProfile.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err) => {
            console.log(err);
        });
};

create_table_user_profile();
