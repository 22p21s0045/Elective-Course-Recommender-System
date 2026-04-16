// /lib/storage.ts

export const storage = {
  getTopics: (): string[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("topics") || "[]")
  },

  setTopics: (topics: string[]) => {
    localStorage.setItem("topics", JSON.stringify(topics))
  },
}