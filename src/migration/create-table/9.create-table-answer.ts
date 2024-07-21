import Answer from "../../models/Answer";

console.log("======Create User Table======");

const create_table_answer = async () => {
    await Answer.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err) => {
            console.log(err);
        });
};

create_table_answer();
