import { z } from "astro/zod";
import certificatesJson from "../content/certificates.json" with { type: "json" };
import profileJson from "../content/profile.json" with { type: "json" };
import projectsJson from "../content/projects.json" with { type: "json" };

const httpsUrl = z.string().url().startsWith("https://");

const projectSchema = z.object({
  slug: z.string().min(1),
  level: z.enum(["flagship", "research", "mention"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  built: z.string().min(1),
  checked: z.string().min(1),
  limits: z.string().min(1),
  demo: httpsUrl.optional(),
  code: httpsUrl.optional(),
  video: httpsUrl.optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  headline: z.string().min(1),
  lede: z.string().min(1),
  statement: z.string().min(1),
  cgpa: z.string().regex(/^\d\.\d{2}$/),
  graduation: z.string().min(1),
  location: z.string().min(1),
  website: httpsUrl,
  linkedin: httpsUrl,
  github: httpsUrl,
  codechef: httpsUrl,
  formEndpoint: httpsUrl,
  internships: z.array(z.object({ role: z.string().min(1), dates: z.string() })).min(1),
  tools: z.string().min(1),
  leadership: z.string().min(1),
  proof: z
    .array(
      z.object({
        figure: z.string().min(1),
        text: z.string().min(1),
        linkText: z.string().optional(),
        href: z.string().optional(),
      }),
    )
    .length(3),
});

const certificateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  issuer: z.string().min(1),
  category: z.string().min(1),
  date: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  certificateFile: z.string().min(1),
  verificationUrl: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectLevel = Project["level"];
export type Profile = z.infer<typeof profileSchema>;
export type Certificate = z.infer<typeof certificateSchema>;

const projects = z.array(projectSchema).parse(projectsJson);
const profile = profileSchema.parse(profileJson);
const certificates = z.array(certificateSchema).parse(certificatesJson);

export function getProjects(level: ProjectLevel): Project[] {
  return projects.filter((project) => project.level === level);
}

export function getProfile(): Profile {
  return profile;
}

export function getCertificates(): Certificate[] {
  return certificates.filter((certificate) => certificate.published !== false);
}
