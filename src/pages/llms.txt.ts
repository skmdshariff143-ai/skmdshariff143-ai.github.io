import type { APIRoute } from "astro";
import { getProfile, getProjects, type Project } from "../lib/content";

function describeProject(project: Project): string {
  const links = [project.demo && `Demo: ${project.demo}`, project.code && `Code: ${project.code}`].filter(Boolean);
  return [
    `### ${project.title}`,
    project.summary,
    `Result: ${project.checked}`,
    `Limits: ${project.limits}`,
    ...links,
  ].join("\n");
}

export const GET: APIRoute = () => {
  const profile = getProfile();
  const projects = [...getProjects("flagship"), ...getProjects("research"), ...getProjects("mention")];
  const body = [
    `# ${profile.name}`,
    `> ${profile.lede}`,
    `Website: ${profile.website}`,
    `LinkedIn: ${profile.linkedin}`,
    `GitHub: ${profile.github}`,
    `Education: B.Tech, Electronics and Communication Engineering, VVIT. CGPA ${profile.cgpa} out of 10. Expected ${profile.graduation}.`,
    "## Projects",
    ...projects.map(describeProject),
  ].join("\n\n");
  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
