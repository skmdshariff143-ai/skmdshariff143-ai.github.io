import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PROJECTS_FILE = new URL("../src/content/projects.json", import.meta.url);
const REQUEST_TIMEOUT_MS = 20_000;
const LOGIN_REDIRECT = "vercel.com/sso-api";

export function findLockedLink(results) {
  return results.find(({ status, location }) => status >= 400 || status === 0 || location.includes(LOGIN_REDIRECT));
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return { url, status: response.status, location: response.headers.get("location") ?? "" };
  } catch (error) {
    return { url, status: 0, location: error instanceof Error ? error.message : "request failed" };
  }
}

async function main() {
  const projects = JSON.parse(await readFile(PROJECTS_FILE, "utf8"));
  const demos = projects.map((project) => project.demo).filter(Boolean);
  const results = await Promise.all(demos.map(fetchStatus));
  const bad = results.filter((result) => findLockedLink([result]));
  for (const result of results) console.log(`${result.status} ${result.url}`);
  if (bad.length > 0) {
    console.error(`Locked or broken demo links: ${bad.map((result) => result.url).join(", ")}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
