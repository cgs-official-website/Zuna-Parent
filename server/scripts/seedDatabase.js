import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

async function seed() {
  console.log('🌱 Starting database seeding on Railway PostgreSQL...\n');

  try {
    // 1. Seed Super Admin
    const adminEmail = 'admin@zuna.com';
    const adminPassword = 'Cgs@001a';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        name: 'Mohamed Asfaque',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      create: {
        name: 'Mohamed Asfaque',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    console.log(`✅ Super Admin ready: ${admin.email} (ID: ${admin.id})`);

    // 2. Seed Default SaaS Products
    const defaultProducts = [
      {
        title: 'Attendance & HRMS',
        category: 'Human Resources',
        badgeColor: '#0084FF',
        description: 'Comprehensive enterprise biometric & GPS attendance, payroll processing, and employee lifecycle management.',
        tier: 'ENTERPRISE',
        demoUrl: 'https://hrms.carrezzaglobalsolutions.com',
        iconKey: 'Users',
        featureTags: ['Biometric Integration', 'Automated Payroll', 'Leave Tracker', 'Shift Rostering'],
        sortOrder: 1,
        isPublished: true
      },
      {
        title: 'Clinic Management System',
        category: 'Healthcare',
        badgeColor: '#10B981',
        description: 'Electronic medical records (EMR), OPD scheduling, prescription generation, and clinic pharmacy management.',
        tier: 'PRO',
        demoUrl: 'https://clinic.carrezzaglobalsolutions.com',
        iconKey: 'Activity',
        featureTags: ['Digital EMR', 'Doctor Scheduling', 'Prescription Billing', 'Lab Reports'],
        sortOrder: 2,
        isPublished: true
      },
      {
        title: 'School Management System',
        category: 'Education',
        badgeColor: '#F59E0B',
        description: 'Complete K-12 campus automation: admissions, exam grading, bus tracking, and parent mobile portal.',
        tier: 'PRO',
        demoUrl: 'https://school.carrezzaglobalsolutions.com',
        iconKey: 'GraduationCap',
        featureTags: ['Student Admissions', 'Fee Collection', 'Exam Reports', 'Bus GPS'],
        sortOrder: 3,
        isPublished: true
      },
      {
        title: 'College Management System',
        category: 'Higher Education',
        badgeColor: '#8B5CF6',
        description: 'University & college degree governance: semester credit tracking, faculty allocation, and hostel fees.',
        tier: 'ENTERPRISE',
        demoUrl: 'https://college.carrezzaglobalsolutions.com',
        iconKey: 'BookOpen',
        featureTags: ['Semester Credits', 'Faculty Portals', 'Hostel Management', 'Placement Cell'],
        sortOrder: 4,
        isPublished: true
      }
    ];

    console.log('\n📦 Seeding SaaS Products...');
    for (const prod of defaultProducts) {
      const existing = await prisma.product.findFirst({
        where: { title: prod.title }
      });

      if (!existing) {
        const created = await prisma.product.create({ data: prod });
        console.log(`  ➕ Created product: ${created.title}`);
      } else {
        console.log(`  ✔ Product exists: ${existing.title}`);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
