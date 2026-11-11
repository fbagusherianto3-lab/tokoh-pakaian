// src/data/portfolioData.ts

// 1. Define the TypeScript interface for your data object
export interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
}

// 2. Create and export the typed array/object
export const projectsData: Project[] = [
  {
    id: 1,
    title: "E-Commerce Dashboard",
    description: "A modern dashboard built with React, Vite, and Tailwind CSS.",
    techStack: ["React", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://example.com",
  },
  {
    id: 2,
    title: "Task Management App",
    description: "An intuitive app to organize your daily tasks and boost productivity.",
    techStack: ["React", "Vite", "TypeScript"],
  },
];