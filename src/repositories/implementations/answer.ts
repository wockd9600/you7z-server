import { Transaction } from "sequelize";
import Answer from "../../models/Answer";
import IAnswerRepository from "../interfaces/answer";

export default class answerRepository implements IAnswerRepository {
    async getLatestAnswers(answerData: Answer) {
        const { session_id } = answerData;
        const limit = 10;

        try {
            return await Answer.findAll({
                where: { session_id },
                order: [["created_at", "DESC"]],
                limit,
            });
        } catch (error) {
            throw error;
        }
    }

    async createAnswer(answerData: Answer, transaction?: Transaction) {
        const { session_id } = answerData;
        const limit = 10;

        try {
            return await Answer.create({
                where: { session_id },
                order: [["created_at", "DESC"]],
                limit,
            });
        } catch (error) {
            throw error;
        }
    }
}
