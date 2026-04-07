import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const sarah = await prisma.user.findUnique({ where: { email: "sarah@mozilor.com" } })
  if (!sarah) { console.error("Sarah not found"); return }

  const user = await prisma.user.create({
    data: {
      name: "Anika Sharma",
      email: "anika@mozilor.com",
      role: "EMPLOYEE",
      mentorId: sarah.id,
    }
  })
  console.log("✅ Created:", user.name, user.email, "| mentor:", sarah.name)
}

main().catch(console.error).finally(() => prisma.$disconnect())
