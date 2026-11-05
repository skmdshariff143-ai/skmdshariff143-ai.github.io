import { expect, test } from "@playwright/test";
import { getCertificates, getProfile, getProjects } from "../src/lib/content";

test("flagships appear in the approved order", () => {
  const titles = getProjects("flagship").map((project) => project.title);
  expect(titles).toEqual(["RecoverFlow AI", "ShaRecon AI", "ResumeScore"]);
});

test("every flagship states what was built, how it was checked and its limits", () => {
  for (const project of getProjects("flagship")) {
    expect(project.built.length).toBeGreaterThan(0);
    expect(project.checked.length).toBeGreaterThan(0);
    expect(project.limits.length).toBeGreaterThan(0);
  }
});

test("RecoverFlow uses the release-record test counts", () => {
  const recoverflow = getProjects("flagship").find((project) => project.slug === "recoverflow-ai");
  expect(recoverflow?.checked).toContain("465 unit and application tests");
  expect(recoverflow?.checked).toContain("73 browser tests");
});

test("profile holds the confirmed facts and no private contact details", () => {
  const profile = getProfile();
  expect(profile.cgpa).toBe("8.21");
  expect(profile.graduation).toBe("May 2027");
  const serialized = JSON.stringify(profile);
  expect(serialized).not.toMatch(/\+91|@vvit\.net/);
  expect(serialized).not.toContain("1,000");
});

test("research and mentions keep their levels", () => {
  expect(getProjects("research").map((project) => project.slug)).toEqual([
    "creditguard-ai",
    "amazon-ml-2026",
    "lfmt-slag-detection",
  ]);
  expect(getProjects("mention").map((project) => project.slug)).toEqual(["neurolearn-ai", "farmlink-ai"]);
});

test("every certificate has a title, issuer and existing category", () => {
  const certificates = getCertificates();
  expect(certificates.length).toBe(25);
  for (const certificate of certificates) {
    expect(certificate.title.length).toBeGreaterThan(0);
    expect(certificate.issuer.length).toBeGreaterThan(0);
  }
});
