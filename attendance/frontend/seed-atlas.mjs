import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const MONGODB_URI = "mongodb+srv://newdukeandduchessattendance_db_user:lf7uibcZ155ivDXc@duke-duchess-attendance.djamnd3.mongodb.net/duke-duchess-attendance?retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  employeeId:  { type: String, unique: true },
  name:        String,
  password:    String,
  role:        { type: String, default: 'EMPLOYEE' },
  designation: String,
  department:  String,
  mobile:      String,
  baseSalary:  { type: Number, default: 0 },
  status:      { type: String, default: 'ACTIVE' },
  faceDescriptor: [Number],
}, { timestamps: true });

const SalonSettingsSchema = new mongoose.Schema({
  salonName:          { type: String, default: 'New Duke & Duchess' },
  latitude:           { type: Number, default: 12.968489 },
  longitude:          { type: Number, default: 77.501320 },
  allowedRadius:      { type: Number, default: 50.0 },
  workStartTime:      { type: String, default: '09:30' },
  workEndTime:        { type: String, default: '19:30' },
  gracePeriodMinutes: { type: Number, default: 15 },
  checkInEnabled:     { type: Boolean, default: true },
  checkOutEnabled:    { type: Boolean, default: true },
  gpsRequired:        { type: Boolean, default: true },
  selfieRequired:     { type: Boolean, default: true },
});

async function runSeed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const SalonSettings = mongoose.models.SalonSettings || mongoose.model('SalonSettings', SalonSettingsSchema);

  // 1. Seed Admin
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await User.findOneAndUpdate(
    { employeeId: 'A001' },
    {
      employeeId: 'A001',
      name: 'Salon Admin',
      password: adminPass,
      role: 'ADMIN',
      designation: 'Manager',
      department: 'Management',
      status: 'ACTIVE'
    },
    { upsert: true, new: true }
  );
  console.log('✓ Admin user seeded successfully (A001 / admin123)');

  // 2. Seed Employee
  const empPass = await bcrypt.hash('emp123', 10);
  const emp = await User.findOneAndUpdate(
    { employeeId: 'E001' },
    {
      employeeId: 'E001',
      name: 'Priya Sharma',
      password: empPass,
      role: 'STAFF',
      designation: 'Senior Hair Stylist',
      department: 'Hair Styling',
      mobile: '9876543210',
      status: 'ACTIVE',
      baseSalary: 25000
    },
    { upsert: true, new: true }
  );
  console.log('✓ Staff user seeded successfully (E001 / emp123)');

  // 3. Seed Salon Settings
  const settings = await SalonSettings.findOneAndUpdate(
    {},
    {
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
    },
    { upsert: true, new: true }
  );
  console.log('✓ Salon geofence settings seeded successfully');

  await mongoose.disconnect();
  console.log('Done! All users & settings are in MongoDB Atlas.');
}

runSeed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
