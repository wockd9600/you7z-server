import Answer from "../../models/Answer";
import IAnswerRepository from "../interfaces/answer";

export default class answerRepository implements IAnswerRepository {
    async getLatestAnswers(answerData: Answer) {
        const { session_id } = answerData;
        const limit = 10;

        try {
            return await Answer.findAll({
                where: { session_id },
                order: [["createdAt", "DESC"]],
                limit,
            });
        } catch (error) {
            throw error;
        }
    }
}
