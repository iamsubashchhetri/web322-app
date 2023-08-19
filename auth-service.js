var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    "userName": String,
    "password": String,
    "email": String,
    "loginHistory": [ { dateTime: Date, userAgent: String  } ]
});

let db; // Move this declaration outside the function

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        db = mongoose.createConnection("mongodb+srv://subashchhetri078:subash@723@cluster0.bp0ywq3.mongodb.net/?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open', ()=>{
            const User = db.model("users", userSchema);
            resolve(User); // Resolve with the User model
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10)
                .then(hash => {
                    db.model("users").create({
                        userName: userData.userName,
                        password: hash,
                        email: userData.email,
                        loginHistory: [{ dateTime: new Date(), userAgent: userData.userAgent }]
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject("There was an error creating the user: " + err.message);
                        }
                    });
                })
                .catch(err => {
                    reject("There was an error encrypting the password: " + err.message);
                });
        }
    });
};

module.exports.checkUser = function(userData) {
    return new Promise(function(resolve, reject) {
        db.model("users").find({ userName: userData.userName })
            .exec()
            .then(function(users) {
                if (users.length == 0) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    bcrypt.compare(userData.password, users[0].password)
                        .then(function(result) {
                            if (!result) {
                                reject("Incorrect Password for user: " + userData.userName);
                            } else {
                                users[0].loginHistory.push({ dateTime: new Date(), userAgent: userData.userAgent });
                                db.model("users").updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                                    .exec()
                                    .then(function() {
                                        resolve(users[0]);
                                    })
                                    .catch(function(err) {
                                        reject("There was an error verifying the user: " + err);
                                    });
                            }
                        })
                        .catch(function() {
                            reject("Unable to find user: " + userData.userName);
                        });
                }
            })
            .catch(function() {
                reject("Unable to find user: " + userData.userName);
            });
    });
};
