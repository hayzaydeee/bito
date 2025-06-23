require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Habit.deleteMany({}),
      HabitEntry.deleteMany({})
    ]);

    // Create sample user
    console.log('Creating sample user...');
    const user = new User({
      email: 'demo@example.com',
      password: 'password123',
      name: 'Demo User',
      isVerified: true,
      preferences: {
        theme: 'auto',
        emailNotifications: true,
        weekStartsOn: 1
      }
    });
    await user.save();

    // Create sample habits
    console.log('Creating sample habits...');
    const habits = [
      {
        name: 'Drink Water',
        description: 'Drink 8 glasses of water throughout the day',
        userId: user._id,
        category: 'health',
        color: '#3B82F6',
        icon: '💧',
        frequency: 'daily',
        target: {
          value: 8,
          unit: 'glasses'
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 0],
          reminderTime: '09:00',
          reminderEnabled: true
        }
      },
      {
        name: 'Morning Exercise',
        description: '30 minutes of morning exercise',
        userId: user._id,
        category: 'fitness',
        color: '#EF4444',
        icon: '🏃‍♂️',
        frequency: 'daily',
        target: {
          value: 30,
          unit: 'minutes'
        },
        schedule: {
          days: [1, 2, 3, 4, 5],
          reminderTime: '07:00',
          reminderEnabled: true
        }
      },
      {
        name: 'Read Books',
        description: 'Read at least 20 pages of a book',
        userId: user._id,
        category: 'learning',
        color: '#10B981',
        icon: '📚',
        frequency: 'daily',
        target: {
          value: 20,
          unit: 'pages'
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 0],
          reminderTime: '20:00',
          reminderEnabled: false
        }
      },
      {
        name: 'Meditation',
        description: '10 minutes of mindfulness meditation',
        userId: user._id,
        category: 'mindfulness',
        color: '#8B5CF6',
        icon: '🧘‍♀️',
        frequency: 'daily',
        target: {
          value: 10,
          unit: 'minutes'
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 0],
          reminderTime: '06:30',
          reminderEnabled: true
        }
      },
      {
        name: 'Learn New Skill',
        description: 'Spend time learning a new programming language or framework',
        userId: user._id,
        category: 'learning',
        color: '#F59E0B',
        icon: '💻',
        frequency: 'daily',
        target: {
          value: 1,
          unit: 'times'
        },
        schedule: {
          days: [1, 2, 3, 4, 5],
          reminderTime: '19:00',
          reminderEnabled: true
        }
      },
      {
        name: 'Call Family',
        description: 'Weekly call with family members',
        userId: user._id,
        category: 'social',
        color: '#EC4899',
        icon: '📞',
        frequency: 'weekly',
        target: {
          value: 1,
          unit: 'times'
        },
        schedule: {
          days: [0], // Sunday
          reminderTime: '15:00',
          reminderEnabled: true
        }
      }
    ];

    const createdHabits = await Habit.insertMany(habits);
    console.log(`Created ${createdHabits.length} sample habits`);

    // Create sample habit entries for the last 30 days
    console.log('Creating sample habit entries...');
    const entries = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      createdHabits.forEach((habit, habitIndex) => {
        // Create entries with varying completion rates
        const completionRate = [0.9, 0.8, 0.95, 0.7, 0.85, 0.6][habitIndex] || 0.8;
        const shouldComplete = Math.random() < completionRate;
        
        if (shouldComplete) {
          entries.push({
            habitId: habit._id,
            userId: user._id,
            date: new Date(date),
            completed: true,
            value: habit.target.value,
            mood: Math.floor(Math.random() * 3) + 3, // 3-5 rating
            notes: i % 7 === 0 ? 'Great progress today!' : '',
            source: 'manual',
            completedAt: new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000) // Random time during the day
          });
        }
      });
    }

    await HabitEntry.insertMany(entries);
    console.log(`Created ${entries.length} sample habit entries`);

    // Update habit statistics
    console.log('Updating habit statistics...');
    for (const habit of createdHabits) {
      await habit.updateStats();
    }

    console.log('Seed data created successfully!');
    console.log('\nSample account:');
    console.log('Email: demo@example.com');
    console.log('Password: password123');
    console.log('\nAPI available at: http://localhost:5000/api');
    console.log('Health check: http://localhost:5000/health');

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('Database connection closed.');
  process.exit(0);
};

// Check if this script is run directly
if (require.main === module) {
  main();
}

module.exports = { seedData };
