import { MongoClient } from 'mongodb';

const dbName = 'duke-duchess-billing';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoBillingClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add MONGODB_URI to your environment variables');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoBillingClientPromise) {
      client = new MongoClient(uri);
      global._mongoBillingClientPromise = client.connect();
    }
    return global._mongoBillingClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getMongoClient() {
  return await getMongoClientPromise();
}

export async function getDb() {
  const c = await getMongoClientPromise();
  return c.db(dbName);
}

export default getDb;
