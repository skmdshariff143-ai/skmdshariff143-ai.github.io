const COOLDOWN_MS = 30_000;
const LAST_SENT_KEY = "portfolio_last_submit_time";

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
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export function initContactForm(form: HTMLFormElement, status: HTMLElement): void {
  const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  let sending = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;

    const honeypot = form.elements.namedItem("_gotcha") as HTMLInputElement | null;
    if (honeypot?.value) {
      form.reset();
      status.textContent = "Thanks. Your message has been sent.";
      return;
    }

    const waitMs = COOLDOWN_MS - (Date.now() - readLastSent());
    if (waitMs > 0) {
      status.textContent = `Please wait ${Math.ceil(waitMs / 1000)} seconds before sending another message.`;
      return;
    }

    sending = true;
    if (button) button.disabled = true;
    status.textContent = "Sending your message.";

    const result = await submitContact(form);

    sending = false;
    if (button) button.disabled = false;
    if (result === "sent") {
      recordSent();
      form.reset();
      status.textContent = "Thanks. Your message has been sent.";
    } else {
      status.textContent = "Your message was not sent, but it is still here. Please try again or use LinkedIn.";
    }
    status.focus();
  });
}
