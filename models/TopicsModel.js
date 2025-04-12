const mongoose = require('mongoose');

const TopicSchema = mongoose.Schema({

    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lesson'
    },
    topic: {
        type: String,
        trim: true,
        required: true
    },
    allfile: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        trim: true
    },
    video: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }

},
    {
        timestamps: true
    }
);

const topic = mongoose.model('topic', TopicSchema);

module.exports = topic;