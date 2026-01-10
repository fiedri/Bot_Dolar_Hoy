import UserModel from "./users.js";

class UserService{

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
                upsert: true, 
                new: true
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