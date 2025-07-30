import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  isLogged: {
    type: Boolean,
    required: true,
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
