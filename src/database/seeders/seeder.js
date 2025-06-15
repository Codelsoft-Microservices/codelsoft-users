import dotenv from 'dotenv';
import { seedUsersMock } from './usersSeeder.js';

dotenv.config({ path: "./.env" });

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");
    const usersSeeded = await seedUsersMock();
    if (usersSeeded) {
      console.log("Database seeding completed successfully.");
    } else {
      console.log("No new data was seeded, collection already has data.");
    }
  } catch (error) {
    console.error("Error during database seeding:", error);
  } finally {
    process.exit(0);
  }
};

seedDatabase().catch((error) => {
  console.error("Error in seeding process:", error);
  process.exit(1);
});