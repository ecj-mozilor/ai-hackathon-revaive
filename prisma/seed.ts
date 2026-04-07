import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const sarah = await prisma.user.create({
    data: { name: "Sarah Chen", email: "sarah@mozilor.com", role: "MENTOR" }
  })
  const arjun = await prisma.user.create({
    data: { name: "Arjun Nair", email: "arjun@mozilor.com", role: "MENTOR" }
  })
  const priya = await prisma.user.create({
    data: { name: "Priya Menon", email: "priya@mozilor.com", role: "EMPLOYEE", mentorId: sarah.id }
  })
  const dev = await prisma.user.create({
    data: { name: "Dev Krishnan", email: "dev@mozilor.com", role: "EMPLOYEE", mentorId: sarah.id }
  })
  const meera = await prisma.user.create({
    data: { name: "Meera Thomas", email: "meera@mozilor.com", role: "EMPLOYEE", mentorId: arjun.id }
  })
  await prisma.user.create({
    data: { name: "Rahul Sinha", email: "rahul@mozilor.com", role: "EMPLOYEE", mentorId: arjun.id }
  })

  await prisma.questionnaireResponse.create({
    data: {
      userId: priya.id,
      designation: "Frontend Developer",
      experience: 2,
      skills: [
        { name: "React", proficiency: "Advanced" },
        { name: "JavaScript", proficiency: "Advanced" },
        { name: "CSS", proficiency: "Intermediate" },
        { name: "Node.js", proficiency: "Beginner" }
      ],
      careerGoal: "Promotion to next level",
      learningFormat: ["Video courses", "Hands-on projects"],
      hoursPerWeek: 5,
      status: "READY_FOR_GENERATION"
    }
  })

  await prisma.mentorInitialFeedback.create({
    data: {
      mentorId: sarah.id,
      employeeId: priya.id,
      strengths: "Strong React skills, great eye for UI details, proactive in code reviews.",
      skillGaps: "Lacks depth in system design and backend fundamentals. Needs to improve TypeScript patterns.",
      softSkills: ["Ownership & Accountability", "Communication"],
      techPriorities: "TypeScript advanced patterns, Node.js basics, system design fundamentals",
      readinessRating: 3
    }
  })

  await prisma.questionnaireResponse.create({
    data: {
      userId: dev.id,
      designation: "Data Analyst",
      experience: 3,
      skills: [
        { name: "SQL", proficiency: "Advanced" },
        { name: "Python", proficiency: "Intermediate" },
        { name: "Excel", proficiency: "Advanced" },
        { name: "Tableau", proficiency: "Beginner" }
      ],
      careerGoal: "Cross-functional transfer",
      learningFormat: ["Articles & blogs", "Hands-on projects"],
      hoursPerWeek: 4,
      status: "AWAITING_MENTOR"
    }
  })

  await prisma.questionnaireResponse.create({
    data: {
      userId: meera.id,
      designation: "Content Strategist",
      experience: 1,
      skills: [
        { name: "Copywriting", proficiency: "Advanced" },
        { name: "SEO", proficiency: "Intermediate" },
        { name: "Analytics", proficiency: "Beginner" }
      ],
      careerGoal: "Lateral move within same function",
      learningFormat: ["Video courses", "Articles & blogs"],
      hoursPerWeek: 3,
      status: "GENERATED"
    }
  })

  await prisma.learningPath.create({
    data: {
      userId: meera.id,
      stages: {
        create: [
          {
            title: "Growth Marketing Fundamentals",
            duration: "2 weeks",
            order: 1,
            resources: {
              create: [
                { title: "Growth Marketing Course", type: "Course", platform: "Reforge", url: null, rationale: "Core growth frameworks", priority: 1, status: "COMPLETED" },
                { title: "Analytics for Marketers", type: "Video", platform: "YouTube", url: null, rationale: "Data-driven decision making", priority: 2, status: "IN_PROGRESS" }
              ]
            }
          },
          {
            title: "Experimentation & A/B Testing",
            duration: "2 weeks",
            order: 2,
            resources: {
              create: [
                { title: "A/B Testing Mastery", type: "Article", platform: "CXL Institute", url: null, rationale: "Core experimentation skills", priority: 1, status: "PENDING" }
              ]
            }
          }
        ]
      }
    }
  })

  console.log("✅ Seed complete")
}

main().catch(console.error).finally(() => prisma.$disconnect())
