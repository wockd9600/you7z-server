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
        const { session_id, user_id, content, is_alert } = answerData;
        const createData: any = {};

        if (session_id !== undefined) createData.session_id = session_id;
        if (user_id !== undefined) createData.user_id = user_id;
        if (content !== undefined) createData.content = content;
        if (is_alert !== undefined) createData.is_alert = is_alert;

        try {
            return await Answer.create(createData);
        } catch (error) {
            throw error;
        }
    }
}
