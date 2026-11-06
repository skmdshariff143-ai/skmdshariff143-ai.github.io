import { z } from "astro/zod";
import caseStudiesJson from "../content/case-studies.json" with { type: "json" };
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
  value: z.string().min(1).optional(),
  outcomes: z.array(z.string().min(1)).min(2).max(3).optional(),
  role: z.string().min(1).optional(),
  stack: z.string().min(1).optional(),
  limitNote: z.string().min(1).optional(),
  door: z
    .object({ plate: z.string().min(1), figure: z.string().min(1), label: z.string().min(1) })
    .optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  targetRole: z.string().min(1),
  positioning: z.string().min(1),
  availability: z.string().min(1),
  education: z.string().min(1),
  pitch: z.string().min(1),
  aiNote: z.string().min(1),
  goal: z.string().min(1),
  languages: z.string().min(1),
  codechefSummary: z.string().min(1),
  cgpa: z.string().regex(/^\d\.\d{2}$/),
  graduation: z.string().min(1),
  location: z.string().min(1),
  website: httpsUrl,
  linkedin: httpsUrl,
  github: httpsUrl,
  codechef: httpsUrl,
  formEndpoint: httpsUrl,
  internships: z
    .array(
      z.object({
        role: z.string().min(1),
        organisation: z.string().min(1),
        dates: z.string().min(1),
        proof: z.string().optional(),
      }),
    )
    .min(1),
  tools: z.string().min(1),
  leadership: z.string().min(1),
  buildLines: z.array(z.string().min(1)).min(2).max(6),
  capabilities: z
    .array(z.object({ title: z.string().min(1), text: z.string().min(1), href: z.string().startsWith("#") }))
    .min(3)
    .max(6),
  proof: z
    .array(
      z.object({
        figure: z.string().min(1),
        text: z.string().min(1),
        linkText: z.string().optional(),
        href: z.string().optional(),
      }),
    )
    .min(3)
    .max(4),
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

const caseStudySchema = z.object({
  slug: z.string().min(1),
  image: z.object({
    name: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(1),
  }),
  audience: z.string().min(1),
  problem: z.array(z.string().min(1)).min(1),
  contribution: z.array(z.string().min(1)).min(1),
  flow: z.array(z.string().min(1)).min(2),
  decisions: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).min(2),
  incident: z.object({ title: z.string().min(1), text: z.string().min(1) }).optional(),
  results: z.array(z.string().min(1)).min(1),
  limits: z.array(z.string().min(1)).min(1),
  next: z.string().min(1),
});

export type CaseStudy = z.infer<typeof caseStudySchema>;

const caseStudies = z.array(caseStudySchema).parse(caseStudiesJson);
const projects = z.array(projectSchema).parse(projectsJson);
const profile = profileSchema.parse(profileJson);
const certificates = z.array(certificateSchema).parse(certificatesJson);

export function getCaseStudy(slug: string): CaseStudy {
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) throw new Error(`Missing case study: ${slug}`);
  return study;
}

export function getProjects(level: ProjectLevel): Project[] {
  return projects.filter((project) => project.level === level);
}

export function getLede(): string {
  return `${profile.education}, graduating ${profile.graduation}. ${profile.pitch}`;
}

export function getFeaturedCertificates(): Certificate[] {
  return getCertificates().filter((certificate) => certificate.featured);
}

export function getProfile(): Profile {
  return profile;
}

export function getCertificates(): Certificate[] {
  return certificates.filter((certificate) => certificate.published !== false);
}
