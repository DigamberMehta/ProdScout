import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
       
    },
});

userSchema.plugin(passportLocalMongoose);

export default mongoose.model('User', userSchema);
