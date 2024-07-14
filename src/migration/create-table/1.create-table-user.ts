import Users from "../../models/User";

console.log("======Create User Table======");

const create_table_users = async () => {
    await Users.sync({ force: true })
        .then(() => {})
        .catch((err) => {
            console.log(err);
        });
};

create_table_users();
