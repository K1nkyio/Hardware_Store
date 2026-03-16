#!/usr/bin/env node

import { pool } from '../src/db/pool.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function viewAllUsers() {
  console.log('\n📋 ALL USERS IN DATABASE\n');
  console.log('='.repeat(50));
  
  try {
    // Get all users (customers and admins)
    const { rows } = await pool.query(`
      SELECT 
        'customer' as user_type,
        id,
        email,
        username,
        full_name,
        role,
        is_active,
        email_verified,
        status,
        created_at,
        last_login_at
      FROM users 

      UNION ALL

      SELECT 
        'admin' as user_type,
        id,
        email,
        username,
        full_name,
        role,
        is_active as is_active,
        null as email_verified,
        status,
        created_at,
        last_login_at
      FROM admins 

      ORDER BY created_at DESC
    `);

    if (rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Display summary
    const customers = rows.filter(u => u.user_type === 'customer');
    const admins = rows.filter(u => u.user_type === 'admin');
    const activeUsers = rows.filter(u => u.is_active);
    const verifiedUsers = rows.filter(u => u.email_verified);

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Users: ${rows.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Active Users: ${activeUsers.length}`);
    console.log(`   Verified Emails: ${verifiedUsers.length}`);

    // Display detailed list
    console.log(`\n📋 DETAILED USER LIST:`);
    console.log('='.repeat(50));
    
    rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.user_type.toUpperCase()}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Full Name: ${user.full_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`);
      if (user.email_verified !== null) {
        console.log(`   Email Verified: ${user.email_verified ? '✅' : '❌'}`);
      }
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      if (user.last_login_at) {
        console.log(`   Last Login: ${new Date(user.last_login_at).toLocaleString()}`);
      } else {
        console.log(`   Last Login: Never`);
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully displayed ${rows.length} users`);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the function
viewAllUsers();
