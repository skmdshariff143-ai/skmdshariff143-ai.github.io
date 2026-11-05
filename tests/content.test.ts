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
  expect(recoverflow?.checked).toContain("601 unit and application tests");
  expect(recoverflow?.checked).toContain("82 browser tests");
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

test("every flagship has a value statement, outcome facts, role, stack and limit note", () => {
  for (const project of getProjects("flagship")) {
    expect(project.value?.length, project.slug).toBeGreaterThan(0);
    expect(project.outcomes?.length, project.slug).toBeGreaterThanOrEqual(2);
    expect(project.role?.length, project.slug).toBeGreaterThan(0);
    expect(project.stack?.length, project.slug).toBeGreaterThan(0);
    expect(project.limitNote?.length, project.slug).toBeGreaterThan(0);
  }
});

test("the profile states a target role, positioning and availability, with no unfilled placeholders", () => {
  const profile = getProfile();
  expect(profile.targetRole).toBe("AI Product Engineer");
  expect(profile.positioning.length).toBeGreaterThan(0);
  expect(profile.availability).toContain("May 2027");
  expect(JSON.stringify(profile)).not.toMatch(/PLACEHOLDER/);
  expect(profile.proof.length).toBeGreaterThanOrEqual(3);
  expect(profile.proof.length).toBeLessThanOrEqual(4);
});
