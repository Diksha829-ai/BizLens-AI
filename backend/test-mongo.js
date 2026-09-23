const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testMongoDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not loaded");
    return;
  }

  console.log("MONGO_URI loaded successfully");

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  try {
    await client.connect();

    await client.db("bizlensai").command({ ping: 1 });

    console.log("=================================");
    console.log("MongoDB Node Driver: CONNECTED");
    console.log("MongoDB ping: SUCCESS");
    console.log("=================================");
  } catch (error) {
    console.error("=================================");
    console.error("MongoDB Node Driver: FAILED");
    console.error(error);
    console.error("=================================");
  } finally {
    await client.close();
  }
}

testMongoDB();