/**
 * Script to drop all habit entries from the database
 * 
 * Usage: node scripts/drop-habit-entries.js
 * 
 * This script safely removes all HabitEntry documents from the database
 * while preserving all other data. Use this for transitioning from 
 * development/testing to production.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import the HabitEntry model
const HabitEntry = require('../models/HabitEntry');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to the database
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Function to count and drop habit entries
async function dropHabitEntries() {
  try {
    // Count habit entries before deletion
    const count = await HabitEntry.countDocuments();
    
    console.log(`Found ${count} habit entries in the database`);
    
    // Confirm deletion
    rl.question(`Are you sure you want to permanently delete all ${count} habit entries? This action cannot be undone. (yes/no): `, async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('Deleting all habit entries...');
        
        // Delete all habit entries
        const result = await HabitEntry.deleteMany({});
        
        console.log(`Successfully deleted ${result.deletedCount} habit entries`);
        
        // Verify deletion
        const remainingCount = await HabitEntry.countDocuments();
        console.log(`Remaining habit entries: ${remainingCount}`);
        
        console.log('Operation completed successfully.');
      } else {
        console.log('Operation cancelled by user.');
      }
      
      // Close the database connection and readline interface
      await mongoose.connection.close();
      rl.close();
      
      console.log('Database connection closed');
    });
  } catch (error) {
    console.error('Error dropping habit entries:', error.message);
    await mongoose.connection.close();
    rl.close();
    process.exit(1);
  }
}

// Main function
async function main() {
  await connectDB();
  await dropHabitEntries();
}

// Run the script
main();
