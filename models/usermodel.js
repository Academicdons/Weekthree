//Require Mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
const UserSchema = new Schema({
username: {
    type: String,
    required: true,
    unique:true,
    trim: true,
},
password: {
    type: String,
    required: true
},
role: {
    type: String,
    required:true
}
});

const AppointmentSchema = mongoose.Schema({
    date: {type:Date, required:true},
    time: {type:String, required:true,},
    isTimeSlotAvailable: {type:Boolean, required: true, default: false}
}, {collection: 'appointment'});

const Appointment = mongoose.model('Booking', AppointmentSchema);
const newUserModel = mongoose.model('userlogindata', UserSchema);
module.exports = {Appointment, newUserModel};