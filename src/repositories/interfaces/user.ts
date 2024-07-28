// type
import { Transaction } from "sequelize";
import User from "../../models/User";
import UserProfile from "../../models/UserProfile";

export default interface IUserRepository {
    findOneUser(user: User): Promise<User | null>;
    findOrCreateUser(user: User, transaction: Transaction): Promise<[User, boolean]>;

    createUserProfile(user_profile: UserProfile, transaction: Transaction): Promise<UserProfile>;

    updateUserRefreshToken(user: User, transaction?: Transaction | null): Promise<void>;
    updateUserProfile(user_profile: UserProfile): Promise<void>;
}
