import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Table } from '../models/Table';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  try {
    await connectDatabase();
    
    // Clear existing data (optional, comment out if you want to keep data)
    // await User.deleteMany({});
    // await Restaurant.deleteMany({});
    // await Table.deleteMany({});
    
    // Create admin user
    const existingUser = await User.findOne({ username: 'admin' });
    if (!existingUser) {
      const admin = new User({ username: 'admin', role: 'ADMIN' });
      await (admin as any).setPassword('admin123');
      await admin.save();
      console.log('✅ Admin user created: username=admin, password=admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Create restaurant
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      restaurant = new Restaurant({
        name: process.env.DEFAULT_RESTAURANT_NAME || 'Le Restaurant',
        phoneNumber: process.env.DEFAULT_RESTAURANT_PHONE || '+1234567890',
        timezone: process.env.DEFAULT_TIMEZONE || 'Europe/Paris',
        slotMinutes: 15,
        avgDurationMin: 90,
        bufferMin: 10,
      });
      await restaurant.save();
      console.log('✅ Restaurant created:', restaurant.name);
    } else {
      console.log('ℹ️  Restaurant already exists');
    }
    
    // Create tables
    const tableCount = await Table.countDocuments({ restaurantId: restaurant._id });
    if (tableCount === 0) {
      const tables = [
        { name: 'Table 1', capacity: 2, zone: 'Window' },
        { name: 'Table 2', capacity: 2, zone: 'Window' },
        { name: 'Table 3', capacity: 4, zone: 'Main' },
        { name: 'Table 4', capacity: 4, zone: 'Main' },
        { name: 'Table 5', capacity: 4, zone: 'Main' },
        { name: 'Table 6', capacity: 6, zone: 'Back' },
        { name: 'Table 7', capacity: 6, zone: 'Back' },
        { name: 'Table 8', capacity: 8, zone: 'Private' },
      ];
      
      for (const tableData of tables) {
        const table = new Table({
          ...tableData,
          restaurantId: restaurant._id,
          isJoinable: true,
        });
        await table.save();
      }
      console.log(`✅ Created ${tables.length} tables`);
    } else {
      console.log(`ℹ️  ${tableCount} tables already exist`);
    }
    
    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

