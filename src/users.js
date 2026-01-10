import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "monitorBCVBot",
        });
        console.log('Conectado a mongo');
    } catch (err) {
        console.error('Error al conectar a mongo', err);
        throw err; 
    }
};

const UserSchema = new mongoose.Schema({
    chatId: { type: Number, unique: true },
    username: String,
    joinedAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;