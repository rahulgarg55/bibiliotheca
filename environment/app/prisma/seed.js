import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing records
  await prisma.systemLog.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.hold.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash standard password for all seed members
  const passwordHash = await bcrypt.hash("password123", 10);

  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      id: "usr-1",
      name: "Alice Smith",
      email: "alice@library.org",
      passwordHash,
      avatarColor: "#f59e0b",
      status: "active",
      role: "user",
      goal: 4,
      goalProgress: 2,
      fines: 0.00
    }
  });

  const user2 = await prisma.user.create({
    data: {
      id: "usr-2",
      name: "Bob Johnson",
      email: "bob@library.org",
      passwordHash,
      avatarColor: "#06b6d4",
      status: "active",
      role: "user",
      goal: 5,
      goalProgress: 3,
      fines: 0.00
    }
  });

  const user3 = await prisma.user.create({
    data: {
      id: "usr-3",
      name: "Charlie Brown",
      email: "charlie@library.org",
      passwordHash,
      avatarColor: "#ef4444",
      status: "active",
      role: "user",
      goal: 3,
      goalProgress: 1,
      fines: 5.50
    }
  });

  const user4 = await prisma.user.create({
    data: {
      id: "usr-4",
      name: "Diana Prince",
      email: "diana@library.org",
      passwordHash,
      avatarColor: "#10b981",
      status: "active",
      role: "user",
      goal: 6,
      goalProgress: 4,
      fines: 0.00
    }
  });

  const userAdmin = await prisma.user.create({
    data: {
      id: "usr-admin",
      name: "Library Administrator",
      email: "admin@library.org",
      passwordHash,
      avatarColor: "#ec4899",
      status: "active",
      role: "admin",
      goal: 0,
      goalProgress: 0,
      fines: 0.00
    }
  });

  // Seed Books
  const books = [
    {
      id: "bk-1",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "978-0441172719",
      genre: "Science Fiction",
      year: 1965,
      rating: 4.8,
      ratingsCount: 2,
      copies: 5,
      available: 3,
      pages: 612,
      summary: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice melange, a drug capable of extending life and enhancing consciousness.",
      coverColor: "linear-gradient(135deg, #f59e0b, #b45309)",
      excerpt: "A beginning is the time for taking the most delicate care that the balances are correct. This every sister of the Bene Gesserit knows. To begin your study of the life of Muad'Dib, then, take care that you first place him in his time: born in the 57th year of the Padishah Emperor, Shaddam IV. And take most special care that you locate him in his place: the planet Arrakis. Do not be deceived by the fact that he was born on Caladan and lived there his first fifteen years. Arrakis, the planet known as Dune, is forever his place..."
    },
    {
      id: "bk-2",
      title: "Sherlock Holmes: A Study in Scarlet",
      author: "Arthur Conan Doyle",
      isbn: "978-1508474814",
      genre: "Mystery",
      year: 1887,
      rating: 4.6,
      ratingsCount: 1,
      copies: 3,
      available: 1,
      pages: 140,
      summary: "The story marks the first appearance of Sherlock Holmes and Dr. Watson, who would become the most famous detective duo in popular fiction. The book's title derives from a speech given by Holmes to Watson on the nature of his work.",
      coverColor: "linear-gradient(135deg, #ef4444, #7f1d1d)",
      excerpt: "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and proceeded to Netley to go through the course prescribed for surgeons in the army. Having completed my studies there, I was duly attached to the Fifth Northumberland Fusiliers as Assistant Surgeon. The regiment was stationed in India at the time, and before I could join it, the second Afghan war had broken out..."
    },
    {
      id: "bk-3",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "978-0743273565",
      genre: "Classic Literature",
      year: 1925,
      rating: 4.4,
      ratingsCount: 0,
      copies: 4,
      available: 4,
      pages: 180,
      summary: "The novel is set in the vicinity of Long Island, New York, during the Jazz Age. It details the encounters of narrator Nick Carraway with the mysterious millionaire Jay Gatsby, who is obsessed with reuniting with his former love, Daisy Buchanan.",
      coverColor: "linear-gradient(135deg, #06b6d4, #0891b2)",
      excerpt: "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. 'Whenever you feel like criticizing any one,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.' He didn't say any more but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that..."
    },
    {
      id: "bk-4",
      title: "Atomic Habits",
      author: "James Clear",
      isbn: "978-0735211292",
      genre: "Self-Help",
      year: 2018,
      rating: 4.9,
      ratingsCount: 1,
      copies: 6,
      available: 5,
      pages: 320,
      summary: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
      coverColor: "linear-gradient(135deg, #10b981, #047857)",
      excerpt: "It is so easy to overestimate the importance of one defining moment and underestimate the value of making small improvements on a daily basis. Too often, we convince ourselves that massive success requires massive action. Whether it is losing weight, building a business, writing a book, winning a championship, or achieving any other goal, we put pressure on ourselves to make some earth-shattering improvement that everyone will talk about..."
    },
    {
      id: "bk-5",
      title: "The Silent Patient",
      author: "Alex Michaelides",
      isbn: "978-1250301697",
      genre: "Thriller",
      year: 2019,
      rating: 4.0,
      ratingsCount: 0,
      copies: 2,
      available: 2,
      pages: 336,
      summary: "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London's most desirable areas. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.",
      coverColor: "linear-gradient(135deg, #8b5cf6, #5b21b6)",
      excerpt: "Alicia Berenson was thirty-three years old when she killed her husband. We had been married for seven years. We were both artists—I was a photographer, and she was a painter. She had a unique talent, a vivid imagination, and a beautiful, quiet soul. I loved her more than life itself. When they found her, she was standing in the studio, a gun on the floor next to her. Gabriel was tied to a chair. She never said a word..."
    },
    {
      id: "bk-6",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-0547928227",
      genre: "Fantasy",
      year: 1937,
      rating: 4.7,
      ratingsCount: 0,
      copies: 4,
      available: 2,
      pages: 310,
      summary: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to enlist him on an adventure.",
      coverColor: "linear-gradient(135deg, #ec4899, #be185d)",
      excerpt: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort. It had a perfectly round door like a porthole, painted green, with a shiny yellow brass knob in the exact middle. The door opened on to a tube-shaped hall like a tunnel: a very comfortable tunnel without smoke..."
    }
  ];

  for (const b of books) {
    await prisma.book.create({ data: b });
  }

  // Seed Reviews
  await prisma.review.createMany({
    data: [
      { id: "rev-1", bookId: "bk-1", user: "Alice Smith", rating: 5, comment: "An absolute masterpiece of world-building!", date: "2026-05-15" },
      { id: "rev-2", bookId: "bk-1", user: "Bob Johnson", rating: 4, comment: "Great story, though details are dense in the middle.", date: "2026-05-20" },
      { id: "rev-3", bookId: "bk-2", user: "Charlie Brown", rating: 5, comment: "The iconic introduction of Sherlock. Highly readable!", date: "2026-05-10" },
      { id: "rev-4", bookId: "bk-4", user: "Diana Prince", rating: 5, comment: "Changed my entire daily routine. A must-read!", date: "2026-05-28" }
    ]
  });

  // Seed Loans
  const loans = [
    {
      id: "loan-1",
      userId: "usr-1",
      bookId: "bk-1",
      borrowDate: new Date("2026-05-10T10:00:00.000Z"),
      dueDate: new Date("2026-05-24T10:00:00.000Z"),
      returnDate: new Date("2026-05-22T14:30:00.000Z"),
      status: "returned",
      fineAmount: 0.0
    },
    {
      id: "loan-2",
      userId: "usr-1",
      bookId: "bk-2",
      borrowDate: new Date("2026-05-25T11:00:00.000Z"),
      dueDate: new Date("2026-06-08T11:00:00.000Z"),
      returnDate: null,
      status: "active",
      fineAmount: 0.0
    },
    {
      id: "loan-3",
      userId: "usr-2",
      bookId: "bk-1",
      borrowDate: new Date("2026-05-26T09:30:00.000Z"),
      dueDate: new Date("2026-06-09T09:30:00.000Z"),
      returnDate: null,
      status: "active",
      fineAmount: 0.0
    },
    {
      id: "loan-4",
      userId: "usr-3",
      bookId: "bk-6",
      borrowDate: new Date("2026-05-01T15:00:00.000Z"),
      dueDate: new Date("2026-05-15T15:00:00.000Z"),
      returnDate: null,
      status: "overdue",
      fineAmount: 5.50
    }
  ];

  for (const l of loans) {
    await prisma.loan.create({ data: l });
  }

  // Seed System Logs
  await prisma.systemLog.createMany({
    data: [
      { id: "log-1", timestamp: new Date("2026-05-01T15:05:00.000Z"), type: "checkout", message: "Charlie Brown borrowed 'The Hobbit' (bk-6)" },
      { id: "log-2", timestamp: new Date("2026-05-10T10:02:00.000Z"), type: "checkout", message: "Alice Smith borrowed 'Dune' (bk-1)" },
      { id: "log-3", timestamp: new Date("2026-05-22T14:30:00.000Z"), type: "return", message: "Alice Smith returned 'Dune' (bk-1)" },
      { id: "log-4", timestamp: new Date("2026-05-25T11:05:00.000Z"), type: "checkout", message: "Alice Smith borrowed 'Sherlock Holmes: A Study in Scarlet' (bk-2)" },
      { id: "log-5", timestamp: new Date("2026-05-26T09:35:00.000Z"), type: "checkout", message: "Bob Johnson borrowed 'Dune' (bk-1)" },
      { id: "log-6", timestamp: new Date("2026-05-27T08:00:00.000Z"), type: "system", message: "Library database persistence initialized successfully" }
    ]
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
