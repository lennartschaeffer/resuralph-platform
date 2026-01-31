import { Annotation } from "@/app/types/annotation";

export const mockAnnotations: Annotation[] = [
  {
    id: "ann_001",
    selectedText: "Managed a team of 8 developers",
    comment:
      "Great leadership experience! Consider adding specific project outcomes.",
    position: {
      pageNumber: 1,
      rects: [{ x: 72, y: 300, width: 250, height: 14 }],
    },
    color: "#ffeb3b",
    priority: "medium",
    tags: ["experience", "leadership"],
    createdAt: new Date("2026-01-15T11:00:00Z"),
    creatorId: "reviewer_001",
  },
  {
    id: "ann_002",
    selectedText: "Proficient in JavaScript, TypeScript, and Python",
    comment:
      "Good tech stack. Maybe also mention frameworks like React/Next.js.",
    position: {
      pageNumber: 1,
      rects: [{ x: 72, y: 420, width: 320, height: 14 }],
    },
    color: "#81d4fa",
    priority: "low",
    tags: ["skills"],
    createdAt: new Date("2026-01-15T11:15:00Z"),
    creatorId: "reviewer_002",
  },
  {
    id: "ann_003",
    selectedText:
      "Led migration of legacy monolith to microservices architecture",
    comment:
      "This is a strong bullet point. Quantify the impact — how many services? What was the performance improvement?",
    position: {
      pageNumber: 1,
      rects: [
        { x: 72, y: 500, width: 300, height: 14 },
        { x: 72, y: 516, width: 150, height: 14 },
      ],
    },
    color: "#a5d6a7",
    priority: "high",
    tags: ["experience", "impact"],
    createdAt: new Date("2026-01-15T11:30:00Z"),
    creatorId: "reviewer_001",
  },
];
