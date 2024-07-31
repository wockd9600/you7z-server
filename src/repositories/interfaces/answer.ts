import Answer from "../../models/Answer";

export default interface IAnswerRepository {
    getLatestAnswers(answerData: Answer): Promise<Answer[]>;
}
