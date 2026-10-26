import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

// This is the EXACT same URI used by seed-atlas.mjs (which worked before)
// The database name is "duke-duchess-attendance"
const MONGODB_URI = "mongodb+srv://newdukeandduchessattendance_db_user:lf7uibcZ155ivDXc@duke-duchess-attendance.djamnd3.mongodb.net/duke-duchess-attendance?retryWrites=true&w=majority";

const SalonSettingsSchema = new mongoose.Schema({
  salonName:          String,
  latitude:           Number,
  longitude:          Number,
  allowedRadius:      Number,
  workStartTime:      String,
  workEndTime:        String,
  gracePeriodMinutes: Number,
  checkInEnabled:     Boolean,
  checkOutEnabled:    Boolean,
  gpsRequired:        Boolean,
  selfieRequired:     Boolean,
}, { timestamps: true });

async function checkAndFix() {
  console.log('Connecting to MongoDB Atlas (duke-duchess-attendance DB)...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const SalonSettings = mongoose.models.SalonSettings || mongoose.model('SalonSettings', SalonSettingsSchema);

  // Show ALL documents in the collection
  const all = await SalonSettings.find({}).lean();
  console.log('\n=== ALL SalonSettings documents in DB ===');
  console.log(JSON.stringify(all, null, 2));
  console.log(`Total documents: ${all.length}`);

  if (all.length === 0) {
    console.log('\nNo settings found! Creating new one...');
    await SalonSettings.create({
      salonName: 'New Duke & Duchess',
      latitude: 12.968489,
      longitude: 77.501320,
      allowedRadius: 50,
      workStartTime: '09:30',
      workEndTime: '19:30',
      gracePeriodMinutes: 15,
      checkInEnabled: true,
      checkOutEnabled: true,
      gpsRequired: true,
      selfieRequired: true,
    });
    console.log('Created!');
  } else {
    console.log('\nUpdating ALL documents with correct coordinates...');
    const result = await SalonSettings.updateMany(
      {},
      {
        $set: {
          latitude: 12.968489,
          longitude: 77.501320,
          allowedRadius: 50,
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} document(s)`);
  }

  // Verify final state
  const final = await SalonSettings.find({}).lean();
  console.log('\n=== FINAL SalonSettings in DB ===');
  final.forEach((s, i) => {
    console.log(`[${i+1}] lat: ${s.latitude}, lng: ${s.longitude}, radius: ${s.allowedRadius}m`);
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

checkAndFix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
