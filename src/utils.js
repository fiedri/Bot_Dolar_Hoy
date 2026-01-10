import UserModel from "./users.js";

class UserService{
    /**
     * Finds a user by their chat ID. If the user doesn't exist, creates a new one.
     * This is an atomic operation.
     * @param {number} chatId The user's chat ID.
     * @param {string} username The user's username.
     * @returns {Promise<User>} The found or newly created user document.
     */
    async findOrCreateUser(chatId, username){
        const user = await UserModel.findOneAndUpdate(
            { chatId: chatId },
            { 
                $setOnInsert: { 
                    username: username, 
                    joinedAt: new Date() 
                } 
            },
            { 
                upsert: true, // Create the document if it does not exist
                new: true     // Return the new or updated document
            }
        );
        return user;
    }

    async getAllUsers(){
        return await UserModel.find({});
    }

    async deleteuser(chatid){
        await UserModel.deleteOne({chatId: chatid});
    }
}

const userService = new UserService();
export default userService;