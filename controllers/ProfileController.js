const LoginModel = require('../models/LoginModel');
const fs = require('fs');

const profile = async (req, res) => {

    try {

        const user = await LoginModel.findById(req.session.userId);

        return res.render('profile', { myprofile: user })

    } catch (error) {
        console.error('Error fetching profile :', error);
    }
}

const profiledata = async (req, res) => {

    try {

        let id = req.session.userId;

        if (req.file) {
            await LoginModel.findByIdAndUpdate(id, { name: req.body.name, email: req.body.email, avatar: req.file.filename, contact: req.body.contact })
        } else {
            await LoginModel.findByIdAndUpdate(id, { name: req.body.name, email: req.body.email, contact: req.body.contact })
        }

        return res.redirect('back');

    } catch (error) {
        console.error('Error fetching profile :', error);
    }
}

module.exports = {
    profile,
    profiledata
}