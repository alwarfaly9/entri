const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true
    }

},
    {
        timestamps: true
    }
);

const chat = mongoose.model('chat', ChatSchema);
module.exports = chat;