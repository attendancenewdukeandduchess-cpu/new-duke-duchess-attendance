import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/duke-duchess';

// Inline models for seed script
const UserSchema = new mongoose.Schema({
  employeeId:  { type: String, unique: true },
  name:        String,
  password:    String,
  role:        { type: String, default: 'EMPLOYEE' },
  designation: String,
  department:  String,
  baseSalary:  { type: Number, default: 0 },
  status:      { type: String, default: 'ACTIVE' },
}, { timestamps: true });

const SalonSettingsSchema = new mongoose.Schema({
  salonName:          { type: String, default: 'New Duke & Duchess' },
  latitude:           { type: Number, default: 0.0 },
  longitude:          { type: Number, default: 0.0 },
  allowedRadius:      { type: Number, default: 100.0 },
  workStartTime:      { type: String, default: '09:30' },
  workEndTime:        { type: String, default: '19:30' },
  gracePeriodMinutes: { type: Number, default: 15 },
  checkInEnabled:     { type: Boolean, default: true },
  checkOutEnabled:    { type: Boolean, default: true },
  gpsRequired:        { type: Boolean, default: true },
  selfieRequired:     { type: Boolean, default: true },
});

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const UserModel          = mongoose.models.User          || mongoose.model('User',          UserSchema);
  const SalonSettingsModel = mongoose.models.SalonSettings || mongoose.model('SalonSettings', SalonSettingsSchema);

  // Admin user
  const adminPass = await bcrypt.hash('admin123', 10);
  await UserModel.findOneAndUpdate(
    { employeeId: 'A001' },
    { employeeId: 'A001', name: 'Salon Admin', password: adminPass, role: 'ADMIN', designation: 'Manager', department: 'Management' },
    { upsert: true, new: true }
  );
  console.log('✓ Admin seeded  (ID: A001 / Password: admin123)');

  // Sample Employee
  const empPass = await bcrypt.hash('emp123', 10);
  await UserModel.findOneAndUpdate(
    { employeeId: 'E001' },
    { employeeId: 'E001', name: 'Priya Sharma', password: empPass, role: 'EMPLOYEE', designation: 'Senior Stylist', department: 'Styling', baseSalary: 25000 },
    { upsert: true, new: true }
  );
  console.log('✓ Employee seeded (ID: E001 / Password: emp123)');

  // Default salon settings
  const existing = await SalonSettingsModel.findOne();
  if (!existing) {
    await SalonSettingsModel.create({
      salonName: 'New Duke & Duchess',
      latitude: 13.0827,   // replace with actual salon lat/lng
      longitude: 80.2707,  // replace with actual salon lat/lng
      allowedRadius: 100,
      workStartTime: '09:30',
      workEndTime: '19:30',
      gracePeriodMinutes: 15,
    });
    console.log('✓ Default salon settings seeded');
  } else {
    console.log('✓ Salon settings already exist – skipped');
  }

  await mongoose.disconnect();
  console.log('\nDatabase seeded successfully! You can now run: npm run dev');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
