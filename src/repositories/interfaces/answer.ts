import { Transaction } from "sequelize";
import Answer from "../../models/Answer";

export default interface IAnswerRepository {
    getLatestAnswers(answerData: Answer): Promise<Answer[]>;

    createAnswer(answerData: Answer, transaction?: Transaction | null): Promise<Answer>;
}
