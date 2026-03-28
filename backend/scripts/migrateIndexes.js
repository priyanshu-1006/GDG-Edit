import 'dotenv/config';
import mongoose from 'mongoose';

const dropIndexIfExists = async (collectionName, indexName) => {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    const exists = indexes.some((index) => index.name === indexName);

    if (!exists) {
      console.log(`ℹ️ ${collectionName}.${indexName} not present, skipping.`);
      return;
    }

    await collection.dropIndex(indexName);
    console.log(`✅ Dropped ${collectionName}.${indexName}`);
  } catch (error) {
    // NamespaceNotFound means collection doesn't exist yet.
    if (error.codeName === 'NamespaceNotFound') {
      console.log(`ℹ️ Collection ${collectionName} not found, skipping.`);
      return;
    }

    throw error;
  }
};

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ Missing required env var: MONGODB_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for index migration');

    await dropIndexIfExists('inductions', 'email_1');
    await dropIndexIfExists('certificates', 'user_1_event_1');

    console.log('🎉 Index migration completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Index migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
