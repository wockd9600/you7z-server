// type
import { Transaction } from "sequelize";
import User from "../../models/User";
import UserProfile from "../../models/UserProfile";
import IUserRepository from "../interfaces/user";

export default class UserRepository implements IUserRepository {
    async findOneUser({ user_id }: User) {
        try {
            return await User.findOne({
                where: { user_id },
            });
        } catch (error) {
            console.error("Error in findUser:", error);
            throw new Error("Failed to find user");
        }
    }

    async findOrCreateUser({ kakao_id, refresh_token }: User, transaction: Transaction) {
        try {
            return await User.findOrCreate({
                where: { kakao_id },
                defaults: {
                    kakao_id,
                    refresh_token,
                },
                transaction,
            });
        } catch (error) {
            console.error("Error in findOrCreateUser:", error);
            throw new Error("Failed to find or create user");
        }
    }

    async updateUserRefreshToken(user: User, transaction: Transaction | null = null) {
        const { user_id, refresh_token: rawRefreshToken } = user;
        const refresh_token = rawRefreshToken ?? null;

        try {
            await User.update(
                { refresh_token },
                {
                    where: { user_id },
                    transaction: transaction || undefined,
                }
            );
            return;
        } catch (error) {
            console.error("Error in updateUserRefreshToken:", error);
            throw new Error("Failed to update user refresh token");
        }
    }

    async createUserProfile({ user_id, nickname }: UserProfile, transaction: Transaction) {
        try {
            return await UserProfile.create({ user_id, nickname }, { transaction });
        } catch (error) {
            console.error("Error in createUserProfile:", error);
            throw new Error("Failed to create user profile");
        }
    }

    async updateUserProfile({ user_id, nickname }: UserProfile) {
        try {
            await User.update({ nickname }, { where: { user_id } });
            return;
        } catch (error) {
            console.error("Error in updateUserProfile:", error);
            throw new Error("Failed to update user profile");
        }
    }
}
