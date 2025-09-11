import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Getting Started with Next.js',
        content: 'Next.js is a powerful React framework that makes building web applications easy and efficient.',
        published: true,
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Introduction to Prisma',
        content: 'Prisma is a next-generation ORM that makes database access easy and type-safe.',
        published: true,
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Building APIs with Express',
        content: 'Express.js is a minimal and flexible Node.js web application framework.',
        published: false,
        authorId: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${posts.length} posts`);
  console.log('🎉 Database seeded successfully!');
  
  const passwordHash = await bcrypt.hash("admin123", 10)

  // Upsert ensures idempotency (runs safely multiple times)
  const admin = await prisma.admin.upsert({
    where: { email: "admin@gmail.com" },
    update: {}, // nothing to update for now
    create: {
      username: "admin",
      email: "admin@gmail.com",
      password: passwordHash,
    },
  })

  console.log("✅ Default admin user ready:", admin)


}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });