interface SettlementCase {
  bank: string;
  isProblem: boolean;
  label: string;
  detail: string;
}

const CASES: Record<string, SettlementCase> = {
  clean: {
    bank: "₹4,882.00",
    isProblem: false,
    label: "Reconciled.",
    detail: "All three records agree, so no one needs to review it.",
  },
  missing: {
    bank: "Not received",
    isProblem: true,
    label: "Exception raised.",
    detail: "The ₹4,882.00 is flagged as uncredited, with its evidence attached for review.",
  },
  collision: {
    bank: "₹4,882.00, matches two orders",
    isProblem: true,
    label: "Sent to a person.",
    detail: "One credit cannot settle two orders, so it is held instead of guessed.",
  },
};

export function initSettlement(form: HTMLFormElement): void {
  const choices = form.querySelector<HTMLFieldSetElement>("fieldset");
  const bank = form.querySelector<HTMLElement>("[data-bank]");
  const label = form.querySelector<HTMLElement>("[data-outcome-label]");
  const detail = form.querySelector<HTMLElement>("[data-outcome-detail]");
  if (!choices || !bank || !label || !detail) return;

  choices.hidden = false;
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", (event) => {
    const selected = CASES[(event.target as HTMLInputElement).value];
    if (!selected) return;
    bank.textContent = selected.bank;
    bank.classList.toggle("gap", selected.isProblem);
    label.textContent = selected.label;
    detail.textContent = selected.detail;
  });
}
