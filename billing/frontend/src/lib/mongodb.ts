import { MongoClient } from 'mongodb';

// Use a SEPARATE env variable for billing so MONGODB_URI (attendance) is untouched
const uri = process.env.MONGODB_BILLING_URI || process.env.MONGODB_URI!;
const dbName = 'duke-duchess-billing';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoBillingClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  throw new Error('Please add MONGODB_BILLING_URI to your environment variables');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoBillingClientPromise) {
    client = new MongoClient(uri);
    global._mongoBillingClientPromise = client.connect();
  }
  clientPromise = global._mongoBillingClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;
