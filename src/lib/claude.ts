import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateLearningPath(employee: any, mentor: any) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `You are an expert Learning & Development coach inside a company.
Generate structured personalised learning paths for employees.
You receive both the employee's self-assessment AND their manager's observations.
Always respond in valid JSON only. No markdown, no prose, no backticks.`,
    messages: [{
      role: "user",
      content: `EMPLOYEE PROFILE:
- Role: ${employee.designation}
- Experience: ${employee.experience} years
- Skills: ${JSON.stringify(employee.skills)}
- Career Goal: ${employee.careerGoal}
- Preferred Format: ${employee.learningFormat.join(", ")}
- Hours/week: ${employee.hoursPerWeek}

MANAGER ASSESSMENT:
- Observed Strengths: ${mentor.strengths}
- Skill Gaps: ${mentor.skillGaps}
- Soft Skills to Develop: ${mentor.softSkills.join(", ")}
- Technical Areas to Prioritise: ${mentor.techPriorities}

Return ONLY this JSON shape:
{
  "goal": string,
  "stages": [{
    "title": string,
    "duration": string,
    "order": number,
    "resources": [{
      "title": string,
      "type": "Video|Article|Course|Book|Project",
      "platform": string,
      "url": string,
      "rationale": string,
      "priority": number
    }]
  }]
}
Rules:
- Generate 2-3 stages, each with 1-2 valid and relevant resources
- Give more priority to existing resources rather than number of resources
- Mentor-identified gaps must be prominently reflected
- Resources must be existing, realistic and on well-known platforms
- Every resource MUST have a url — never leave it null or empty`
    }]
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : ""
  const cleaned = raw.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}
