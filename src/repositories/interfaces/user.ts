// type
import { Transaction } from "sequelize";
import User from "../../models/User";
import UserProfile from "../../models/UserProfile";

export default interface IUserRepository {
    findOneUser(user: User): Promise<User | null>;
    findOrCreateUser(user: User, transaction: Transaction): Promise<[User, boolean]>;
    updateUserRefreshToken(user: User, transaction?: Transaction | null): Promise<void>;
    createUserProfile(user_profile: UserProfile, transaction: Transaction): Promise<UserProfile>;
    updateUserProfile(user_profile: UserProfile): Promise<void>;
}
