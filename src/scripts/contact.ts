const COOLDOWN_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;
const LAST_SENT_KEY = "portfolio_last_submit_time";
const SENT_MESSAGE = "Thanks. Your message has been sent.";

export type SubmitResult = "sent" | "failed";

function readLastSent(): number {
  try {
    return Number(sessionStorage.getItem(LAST_SENT_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function recordSent(): void {
  try {
    sessionStorage.setItem(LAST_SENT_KEY, String(Date.now()));
  } catch {
    // Storage can be unavailable. The cooldown is optional, so sending still succeeds.
  }
}

export async function submitContact(form: HTMLFormElement): Promise<SubmitResult> {
  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

function showFailure(form: HTMLFormElement, status: HTMLElement): void {
  const linkedin = document.createElement("a");
  linkedin.href = form.dataset["linkedin"] ?? "";
  linkedin.textContent = "LinkedIn";
  status.replaceChildren("Your message was not sent, but it is still here. Please try again or use ", linkedin, ".");
}

function blockedByGuard(form: HTMLFormElement, status: HTMLElement): boolean {
  const honeypot = form.elements.namedItem("_gotcha") as HTMLInputElement | null;
  if (honeypot?.value) {
    form.reset();
    status.textContent = SENT_MESSAGE;
    return true;
  }
  const waitMs = COOLDOWN_MS - (Date.now() - readLastSent());
  if (waitMs > 0) {
    status.textContent = `Please wait ${Math.ceil(waitMs / 1000)} seconds before sending another message.`;
    return true;
  }
  return false;
}

async function sendAndReport(form: HTMLFormElement, status: HTMLElement): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (button) button.disabled = true;
  status.textContent = "Sending your message.";

  const result = await submitContact(form);

  if (button) button.disabled = false;
  if (result === "sent") {
    recordSent();
    form.reset();
    status.textContent = SENT_MESSAGE;
  } else {
    showFailure(form, status);
  }
  status.focus();
}

export function initContactForm(form: HTMLFormElement, status: HTMLElement): void {
  let sending = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || blockedByGuard(form, status)) return;
    sending = true;
    await sendAndReport(form, status);
    sending = false;
  });
}
