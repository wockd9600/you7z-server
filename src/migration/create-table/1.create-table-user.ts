import Users from "../../models/User";

console.log("======Create User Table======");

const create_table_user = async () => {
    await Users.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err: any) => {
            console.log(err);
        });
};

create_table_user();
