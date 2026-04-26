// /lib/constants.ts
// "@/lib/constants"

export const TOPICS = [
  "Business & Management",
  "Web Development",
  "Professional Practice & Soft Skills",
  "Data Science & AI",
  "Software Engineering",
  "Cybersecurity",
  "Databases & Data Engineering",
  "Mathematics & Statistics",
  "Networking",
  "DevOps & Architecture",
  "UX/UI Design",
  "IT Fundamentals",
] as const

export const COURSES = [
  { code: "INT101", name: "Intro to Logic" },
  { code: "INT222", name: "Foundations of Ethics" },
  { code: "INT333", name: "Web Programming" },
  { code: "CSC215", name: "Data Structures" },
  { code: "MTH201", name: "Calculus I" },
]

export const GRADES = ["A", "B+", "B", "C+", "C", "D+", "D", "F"]