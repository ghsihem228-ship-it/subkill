import type { Subscription } from "@prisma/client"

export type LetterTemplateType = "cancellation_demand" | "certified_mail" | "chargeback" | "ag_complaint"

export const LETTER_TEMPLATES: Record<LetterTemplateType, { label: string; description: string }> = {
  cancellation_demand: {
    label: "Cancellation Demand",
    description: "Firm non-renewal and cancellation demand to the merchant",
  },
  certified_mail: {
    label: "Certified Mail",
    description: "Proof-of-delivery backup cancellation letter",
  },
  chargeback: {
    label: "Chargeback Notice",
    description: "Dispute notice to your card issuer or carrier",
  },
  ag_complaint: {
    label: "AG Complaint",
    description: "State attorney-general consumer complaint",
  },
}

export function isLetterTemplateType(value: unknown): value is LetterTemplateType {
  return typeof value === "string" && value in LETTER_TEMPLATES
}

export function letterTitle(templateType: LetterTemplateType, subscriptionName: string) {
  return `${LETTER_TEMPLATES[templateType].label} — ${subscriptionName}`
}

function money(amount: number) {
  return `$${amount.toFixed(2)}`
}

function period(cadence: string) {
  return cadence === "yearly" ? "year" : "month"
}

type LetterSub = Pick<Subscription, "name" | "merchant" | "amount" | "cadence">

function cancellationDemand(sub: LetterSub) {
  return `[Today's Date]

${sub.merchant}
Attn: Cancellations / Billing Department
RE: ${sub.name} — Account [Acct ••••]

To whom it may concern:

I, [Your Name], am the holder of the account referenced above, which carries a ${sub.name} subscription billed at ${money(sub.amount)} per ${period(sub.cadence)}. This letter is formal notice that I am canceling that subscription effective at the end of the current billing period. I do not consent to any further charges, to any auto-renewal, or to any new or extended term.

I demand that you: (1) process the cancellation effective at the end of the current billing period; (2) stop all future billing to the payment method on file; (3) remove that payment method from your records; and (4) send written confirmation of the cancellation and its effective date to my address of record within ten (10) business days of receipt of this letter.

If any charge is processed after the effective date, I will dispute it with my card issuer and file complaints with the state attorney general's consumer-protection division and the Better Business Bureau. I reserve all rights and remedies available to me at law or in equity.

Please confirm receipt of this notice in writing.

Sincerely,

[Your Name]
Account holder — [Acct ••••]`
}

function certifiedMail(sub: LetterSub) {
  return `[Today's Date]

${sub.merchant}
Attn: Cancellations / Billing Department
RE: ${sub.name} — Account [Acct ••••]
Sent via USPS Certified Mail, Return Receipt Requested

To whom it may concern:

I, [Your Name], am the account holder referenced above, billed ${money(sub.amount)} per ${period(sub.cadence)} for ${sub.name}. This letter serves as backup written notice of cancellation, effective at the end of the current billing period, and as documentation of my demand that all recurring billing stop.

I have previously requested cancellation of this subscription through your other service channels. To remove any ambiguity, this notice is being sent by certified mail with return receipt so that the date and fact of delivery are a matter of record. Please process the cancellation, stop all recurring charges, delete my payment method from your files, and send written confirmation of the cancellation and final billing date within ten (10) business days of delivery.

If charges continue after the effective date, the certified-mail receipt and this letter will support a billing dispute with my card issuer and a complaint with the state attorney general's consumer-protection division. I reserve all rights and remedies available to me.

Sincerely,

[Your Name]
Account holder — [Acct ••••]`
}

function chargeback(sub: LetterSub) {
  return `[Today's Date]

Card Issuer / Billing Carrier — Billing Disputes Department
RE: Unauthorized recurring charges from ${sub.merchant}
Merchant: ${sub.merchant} (${sub.name})
Account holder: [Your Name] — [Acct ••••]

To the Billing Disputes Department:

I, [Your Name], am disputing recurring charges of ${money(sub.amount)} per ${period(sub.cadence)} from the merchant named above, billed to my account [Acct ••••]. I requested cancellation of this subscription effective at the end of the last billing period, in the manner required by the merchant, and I have received no confirmation that the cancellation was processed. Charges assessed after my cancellation request were not authorized by me and remain unreimbursed.

I am providing this written notice of dispute within the period allowed by the Fair Credit Billing Act and applicable card-network rules. I request that you: (1) open a dispute for all post-cancellation charges from this merchant; (2) issue a provisional credit while the dispute is investigated; (3) permanently credit the disputed amounts if the merchant cannot produce my signed, dated cancellation request or proof that services were provided after the cancellation date; and (4) block the merchant from future billing of my account.

Supporting documentation — my cancellation request, the merchant's cancellation policy, and certified-mail proof of delivery — is available on request. Please acknowledge this dispute in writing within the time frame required by law.

Sincerely,

[Your Name]
Account holder — [Acct ••••]`
}

function agComplaint(sub: LetterSub) {
  return `[Today's Date]

Office of the Attorney General — Consumer Protection Division
[State]

Complaint against: ${sub.merchant}
Product: ${sub.name} subscription — ${money(sub.amount)} per ${period(sub.cadence)}
Complainant: [Your Name] — [Acct ••••]

To the Consumer Protection Division:

I, [Your Name], am filing this complaint against ${sub.merchant} regarding its subscription cancellation practices. The company charges my account ${money(sub.amount)} per ${period(sub.cadence)} for ${sub.name} and has made cancellation unreasonably difficult: it requires cancellation through restrictive channels, ignores or refuses written requests, and continues billing after notice of cancellation has been given.

Specifically, I requested cancellation in the manner the company itself prescribes, yet billing has continued and the company has not provided written confirmation of the cancellation or its effective date. I have sent a backup cancellation notice by certified mail with return receipt, and the delivery record is available to your office. The company's conduct appears designed to deter cancellation and to collect charges after notice has been given, in violation of state consumer-protection and automatic-renewal laws.

I request that your office investigate this company's cancellation and auto-renewal practices, intervene to stop further charges to my account, and refer this matter for enforcement action if warranted. I am seeking cessation of all future charges, a refund of charges assessed after my cancellation notice, and any other relief available under state law.

Supporting documentation — my membership agreement, cancellation requests, certified-mail receipts, and billing statements — is available on request.

Respectfully,

[Your Name]
[Address]
[Phone] / [Email]`
}

const BUILDERS: Record<LetterTemplateType, (sub: LetterSub) => string> = {
  cancellation_demand: cancellationDemand,
  certified_mail: certifiedMail,
  chargeback: chargeback,
  ag_complaint: agComplaint,
}

export function buildFallbackLetter(templateType: LetterTemplateType, sub: LetterSub) {
  return BUILDERS[templateType](sub)
}
