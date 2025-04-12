// Importing required modules 
const fs = require('fs');
const path = require('path');
const videofile = path.join('./videofile');

// Importing models
const TopicsModel = require('../models/TopicsModel');
const LessonModel = require('../models/LessonModel');
const LoginModel = require('../models/LoginModel');
const ReadModel = require("../models/ReadModel");
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const CertificateModel = require('../models/CertificateModel');

// view for add topic
const topics = async (req, res) => {

    try {

        // extract lesson id
        let lessonId = req.query.id

        // fetch lession and course name 
        const lesson = await LessonModel.findById({ _id: lessonId }).populate('courseId');

        return res.render('topics', { lesson: lesson, });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// add topic
const topicsdata = async (req, res) => {

    try {

        // Extract data from the request body
        const lessonId = req.query.id;
        const topic = req.body.topic;
        const link = req.body.link;
        const allfile = req.files && req.files.allfile && req.files.allfile[0] ? videofile + '/' + req.files.allfile[0].filename : null;
        const video = req.files && req.files.video_file && req.files.video_file[0] ? videofile + '/' + req.files.video_file[0].filename : null;
        const description = req.body.description.replace(/"/g, '&quot;');

        // save topic
        const saveTopic = await new TopicsModel({ lessonId, topic, link, allfile, video, description }).save();

        return res.redirect(`/viewtopics?id=${lessonId}`);

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// view all topic
const viewtopics = async (req, res) => {

    try {

        let id = req.query.id

        // fetch topic
        const viewtopics = await TopicsModel.find({ lessonId: id }).populate('lessonId');

        // fetch lession and course name 
        const lesson = await LessonModel.findById({ _id: id }).populate('courseId');

        // fetch login
        const loginData = await LoginModel.find({});

        return res.render('viewtopics', { mytopics: viewtopics, lesson: lesson, loginData: loginData });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// view for edit topic
const edittopic = async (req, res) => {

    try {


        let id = req.query.id;

        const topic = await TopicsModel.findById({ _id: id });

        // fetch lession and course name 
        const lesson = await LessonModel.findById({ _id: topic.lessonId }).populate('courseId');

        return res.render('edittopic', { edittopic: topic, lesson: lesson });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// edit topic
const updatetopic = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const lessonId = req.body.lessonId;
        const topic = req.body.topic;
        const link = req.body.link;
        const oldFile = req.body.oldFile;
        const oldVideo = req.body.oldVideo;
        const description = req.body.description.replace(/"/g, '&quot;');

        let allfile = oldFile;
        if (req.files && req.files['allfile'] && req.files['allfile'][0]) {
            //delete  old file
            if (fs.existsSync(oldFile)) {
                fs.unlinkSync(oldFile)
            }
            allfile = videofile + '/' + req.files.allfile[0].filename;
        }

        // Update video if new files are uploaded
        let video = oldVideo;
        if (req.files && req.files['video_file'] && req.files['video_file'][0]) {
            // delete  old video
            if (fs.existsSync(oldVideo)) {
                fs.unlinkSync(oldVideo)
            }
            video = videofile + '/' + req.files.video_file[0].filename;
        }

        // update topic
        const updateTopic = await TopicsModel.findByIdAndUpdate(id, { lessonId, topic, link, allfile, video, description });

        return res.redirect(`/viewtopics?id=${lessonId}`);

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// delete topic
const deletetopic = async (req, res) => {

    try {

        const id = req.query.id;

        // Fetch the topic and populate lessonId and courseId
        const existingTopic = await TopicsModel.findById(id).populate({
            path: 'lessonId',
            populate: {
                path: 'courseId',
                select: 'course'
            }
        });

        // If the topic doesn't exist, handle it gracefully
        if (!existingTopic) {
            req.flash('error', 'Topic not found');
            return res.redirect(`/viewtopics?id=${id}`);
        }

        // Check if lessonId and courseId are properly populated
        if (!existingTopic.lessonId || !existingTopic.lessonId.courseId) {
            req.flash('error', 'Lesson or course data is missing.');
            return res.redirect(`/viewtopics?id=${id}`);
        }

        // Delete files associated with the topic
        if (existingTopic.allfile && fs.existsSync(existingTopic.allfile)) {
            fs.unlinkSync(existingTopic.allfile);
        }

        if (existingTopic.video && fs.existsSync(existingTopic.video)) {
            fs.unlinkSync(existingTopic.video);
        }

        // Delete related records using courseId
        const courseId = existingTopic.lessonId.courseId._id;

        await Promise.all([
            ReadModel.deleteMany({ courseId }),
            CompletedPercentageModel.deleteMany({ courseId }),
            AssignmentPercentageModel.deleteMany({ courseId }),
            AttemptAssignmentModel.deleteMany({ courseId }),
            CertificateModel.deleteMany({ courseId })
        ]);

        // Delete certificate images
        const certificates = await CertificateModel.find({ courseId });
        certificates.forEach(certificate => {
            if (fs.existsSync(certificate.imagePath)) {
                fs.unlinkSync(certificate.imagePath);
            }
        });

        // Finally, delete the topic
        await TopicsModel.deleteOne({ _id: id });

        // Redirect back to the view topics page using the lessonId
        return res.redirect(`/viewtopics?id=${existingTopic.lessonId._id}`);

    } catch (error) {
        console.error('Error deleting topic:', error);
        req.flash('error', 'An error occurred while deleting the topic.');
        return res.redirect(`/viewtopics?id=${existingTopic.lessonId._id}`);
    }
};

module.exports = {
    topics,
    topicsdata,
    viewtopics,
    deletetopic,
    edittopic,
    updatetopic
}