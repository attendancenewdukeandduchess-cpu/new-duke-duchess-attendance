const mongoose = require('mongoose');

const uri = 'mongodb+srv://newdukeandduchessattendance_db_user:lf7uibcZ155ivDXc@duke-duchess-attendance.djamnd3.mongodb.net/?appName=duke-duchess-attendance';

const SalonSettingsSchema = new mongoose.Schema({
  salonName: String,
  latitude: Number,
  longitude: Number,
  allowedRadius: Number,
  workStartTime: String,
  workEndTime: String,
  gracePeriodMinutes: Number,
  checkInEnabled: Boolean,
  checkOutEnabled: Boolean,
  gpsRequired: Boolean,
  selfieRequired: Boolean,
});

async function fix() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected!');

  const SalonSettings = mongoose.models.SalonSettings || mongoose.model('SalonSettings', SalonSettingsSchema);

  // Show current settings first
  const current = await SalonSettings.findOne().lean();
  console.log('\nCurrent settings in DB:');
  console.log('  latitude:     ', current ? current.latitude : 'N/A');
  console.log('  longitude:    ', current ? current.longitude : 'N/A');
  console.log('  allowedRadius:', current ? current.allowedRadius : 'N/A');

  // Force update with correct values
  const result = await SalonSettings.findOneAndUpdate(
    {},
    {
      $set: {
        latitude: 12.968489,
        longitude: 77.501320,
        allowedRadius: 50,
      }
    },
    { upsert: true, new: true }
  ).lean();

  console.log('\nUpdated settings in DB:');
  console.log('  latitude:     ', result.latitude);
  console.log('  longitude:    ', result.longitude);
  console.log('  allowedRadius:', result.allowedRadius, 'meters');
  console.log('\nSUCCESS! Live database updated.');

  await mongoose.disconnect();
}

fix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
