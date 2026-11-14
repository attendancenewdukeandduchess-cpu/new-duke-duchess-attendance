// Script to copy missing users from "test" DB to "duke-duchess-attendance" DB
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://newdukeandduchessattendance_db_user:lf7uibcZ155ivDXc@ac-sjmrli9-shard-00-00.djamnd3.mongodb.net:27017,ac-sjmrli9-shard-00-01.djamnd3.mongodb.net:27017,ac-sjmrli9-shard-00-02.djamnd3.mongodb.net:27017/?ssl=true&replicaSet=atlas-jbf2mo-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB Atlas\n');

  const testDb = client.db('test');
  const attendanceDb = client.db('duke-duchess-attendance');

  // Get users from test DB that need to be moved
  const usersToMove = await testDb.collection('users').find({
    employeeId: { $in: ['E007', 'E008', 'E009', 'E002'] }
  }).toArray();

  console.log(`Found ${usersToMove.length} users in test DB to recover:`);
  usersToMove.forEach(u => console.log(`  ${u.employeeId} | ${u.name} | hasFace: ${!!u.faceDescriptor}`));

  // Check which ones already exist in attendance DB
  const existingUsers = await attendanceDb.collection('users').find({}).toArray();
  const existingIds = existingUsers.map(u => u.employeeId);
  console.log(`\nExisting in attendance DB: ${existingIds.join(', ')}`);

  let copied = 0;
  for (const user of usersToMove) {
    if (existingIds.includes(user.employeeId)) {
      // E002 already exists as "lali" in attendance DB, skip unless it has face data we need
      const existing = existingUsers.find(u => u.employeeId === user.employeeId);
      if (!existing.faceDescriptor && user.faceDescriptor) {
        // Update with face data
        await attendanceDb.collection('users').updateOne(
          { employeeId: user.employeeId },
          { $set: { faceDescriptor: user.faceDescriptor } }
        );
        console.log(`  Updated face data for ${user.employeeId} (${existing.name})`);
        copied++;
      } else {
        console.log(`  Skipped ${user.employeeId} (${user.name}) — already exists as ${existing.name}`);
      }
    } else {
      // Copy to attendance DB
      const { _id, ...userData } = user;
      await attendanceDb.collection('users').insertOne({
        ...userData,
        _id: new ObjectId(_id)
      });
      console.log(`  ✅ Recovered ${user.employeeId} (${user.name}) with face data: ${!!user.faceDescriptor}`);
      copied++;
    }
  }

  // Also copy any attendance records from test DB
  const testAttendances = await testDb.collection('attendances').find({}).toArray();
  if (testAttendances.length > 0) {
    console.log(`\nFound ${testAttendances.length} attendance records in test DB`);
    for (const att of testAttendances) {
      const { _id, ...attData } = att;
      try {
        await attendanceDb.collection('attendances').insertOne({ ...attData, _id: new ObjectId(_id) });
        console.log(`  ✅ Recovered attendance: ${att.date} for userId ${att.userId}`);
      } catch (e) {
        if (e.code === 11000) console.log(`  Skipped duplicate attendance: ${att.date}`);
        else console.log(`  Error: ${e.message}`);
      }
    }
  }

  // Verify final state
  console.log('\n=== FINAL STATE: duke-duchess-attendance users ===');
  const finalUsers = await attendanceDb.collection('users').find({}).toArray();
  finalUsers.forEach(u => console.log(`  ${u.employeeId} | ${u.name} | ${u.role} | hasFace: ${!!u.faceDescriptor}`));

  console.log(`\n✅ Done! Recovered ${copied} users.`);

  await client.close();
}

main().catch(console.error);
