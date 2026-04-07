import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const emails = ["priya@mozilor.com", "meera@mozilor.com"]

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { learningPath: { include: { stages: { include: { resources: true } } } } }
    })

    if (!user) { console.log(`⚠️  ${email} not found`); continue }

    if (user.learningPath) {
      // Delete resources → stages → learningPath (cascade order)
      for (const stage of user.learningPath.stages) {
        await prisma.resource.deleteMany({ where: { stageId: stage.id } })
      }
      await prisma.stage.deleteMany({ where: { learningPathId: user.learningPath.id } })
      await prisma.learningPath.delete({ where: { id: user.learningPath.id } })
      console.log(`🗑️  Deleted learning path for ${user.name}`)
    } else {
      console.log(`ℹ️  No learning path found for ${user.name}`)
    }

    await prisma.questionnaireResponse.updateMany({
      where: { userId: user.id },
      data: { status: "READY_FOR_GENERATION" }
    })
    console.log(`✅ Reset questionnaire status to READY_FOR_GENERATION for ${user.name}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
