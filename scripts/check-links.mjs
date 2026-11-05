import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PROJECTS_FILE = new URL("../src/content/projects.json", import.meta.url);
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const LOGIN_PATTERN = /vercel\.com\/(sso-api|login)|\/(login|signin|sign-in)(\/|\?|$)/i;

export function findLockedLink(results) {
  return results.find(({ status, location }) => status >= 400 || status === 0 || LOGIN_PATTERN.test(location));
}

async function fetchOnce(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

async function followRedirects(startUrl) {
  let url = startUrl;
  let visited = "";
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const { status, location } = await fetchOnce(url);
      if (status < 300 || status >= 400 || !location) {
        return { url: startUrl, status, location: visited };
      }
      visited = `${visited} ${location}`.trim();
      url = new URL(location, url).href;
    }
    return { url: startUrl, status: 0, location: `Too many redirects: ${visited}` };
  } catch (error) {
    return { url: startUrl, status: 0, location: error instanceof Error ? error.message : "request failed" };
  }
}

async function main() {
  const projects = JSON.parse(await readFile(PROJECTS_FILE, "utf8"));
  const links = projects.flatMap((project) => [project.demo, project.code, project.video]).filter(Boolean);
  const results = await Promise.all(links.map(followRedirects));
  for (const result of results) console.log(`${result.status} ${result.url}`);
  const bad = results.filter((result) => findLockedLink([result]));
  if (bad.length > 0) {
    console.error(`Locked or broken links: ${bad.map((result) => result.url).join(", ")}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
