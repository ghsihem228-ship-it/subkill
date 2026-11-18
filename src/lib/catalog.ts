// SubKill — subscription catalog with authored cancellation workflows.
// Shared by the seeder (src/lib/seed.ts) and the reset endpoint.

export type StepSeed = {
  order: number
  title: string
  description: string
  type: "digital" | "phone" | "mail" | "in_person"
  hoop?: boolean
  hoopScript?: string
  estimatedMinutes: number
}

export type SubscriptionSeed = {
  slug: string
  name: string
  merchant: string
  amount: number
  cadence: "monthly" | "yearly"
  category: string
  icon: string
  difficulty: number
  difficultyReason: string
  detectedVia: "bank" | "email" | "appstore"
  nextChargeInDays: number
  notes: string
  cancellationMethod: string
  steps: StepSeed[]
}

export const PROVIDERS: Record<
  string,
  { provider: string; name: string; type: "bank" | "email" | "appstore"; maskedRef: string; blurb: string }
> = {
  chase: {
    provider: "chase",
    name: "Chase Checking",
    type: "bank",
    maskedRef: "Chase Checking ••4821",
    blurb: "6 months of card transactions analyzed for recurring merchants",
  },
  gmail: {
    provider: "gmail",
    name: "Gmail",
    type: "email",
    maskedRef: "Gmail — jane.doe@",
    blurb: "Receipts, renewals and billing notices scanned for subscriptions",
  },
  appstore: {
    provider: "appstore",
    name: "App Store",
    type: "appstore",
    maskedRef: "Apple ID — j•••@icloud.com",
    blurb: "Active in-app purchases and auto-renewing app subscriptions",
  },
}

export const SUBSCRIPTION_CATALOG: SubscriptionSeed[] = [
  {
    slug: "megagym",
    name: "MegaGym Nation",
    merchant: "MEGAGYM NATION #2214",
    amount: 59.0,
    cadence: "monthly",
    category: "Fitness",
    icon: "dumbbell",
    difficulty: 10,
    difficultyReason: "In-branch cancellation only, 30-day written notice, aggressive retention scripts and a certified-mail backup requirement.",
    detectedVia: "bank",
    nextChargeInDays: 6,
    notes: "Member since 2021. Contract auto-renews every 12 months. Phone and email cancellations are explicitly rejected.",
    cancellationMethod: "In-person visit + certified mail",
    steps: [
      {
        order: 1,
        title: "Review your contract terms",
        description:
          "Check your membership agreement for the notice period (usually 30 days written notice) and the cancellation address. Screenshot the cancellation clause — you will need it if they stall.",
        type: "digital",
        estimatedMinutes: 10,
      },
      {
        order: 2,
        title: "Visit your home branch in person",
        description:
          "Go to the branch with a photo ID and your membership card. MegaGym requires in-branch cancellation — phone and email requests are not accepted by policy.",
        type: "in_person",
        estimatedMinutes: 25,
      },
      {
        order: 3,
        title: "Decline the retention offers",
        description:
          "The rep will offer 2 free months, then a 'freeze' option, then a downgrade to a basic plan. Accepting any of these restarts the notice clock.",
        type: "digital",
        hoop: true,
        hoopScript:
          "Say exactly: 'I am canceling my membership today. Please process the cancellation now.' Repeat it word for word for every counter-offer.",
        estimatedMinutes: 8,
      },
      {
        order: 4,
        title: "Get the signed cancellation receipt",
        description:
          "Do not leave the branch without a signed and dated cancellation confirmation. If the rep refuses, ask for the branch manager and write down their name.",
        type: "in_person",
        estimatedMinutes: 5,
      },
      {
        order: 5,
        title: "Mail the certified backup letter",
        description:
          "Send a certified-mail cancellation letter to MegaGym HQ as backup proof. Generate it from the Letters tab with the 'Certified Mail' template and keep the tracking number.",
        type: "mail",
        estimatedMinutes: 15,
      },
      {
        order: 6,
        title: "Monitor the next statement",
        description:
          "Watch your next card statement. If you are still billed, dispute the charge with your bank and attach the signed receipt as evidence.",
        type: "digital",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    slug: "megasuite",
    name: "MegaSuite CRM (2 seats)",
    merchant: "MEGASUITE INC *SEAT",
    amount: 178.0,
    cadence: "monthly",
    category: "SaaS",
    icon: "workflow",
    difficulty: 9,
    difficultyReason: "Enterprise auto-renewal contract with a 60-day non-renewal clause, a dedicated retention desk and counter-offer hoops.",
    detectedVia: "email",
    nextChargeInDays: 19,
    notes: "Billed per seat ($89 x 2). The MSA auto-renews for 12 months unless notice is given 60 days before renewal.",
    cancellationMethod: "Written notice + retention call",
    steps: [
      {
        order: 1,
        title: "Export your data first",
        description:
          "Settings > Data Management > Export. Enterprise auto-renewals are enforceable — get your data out before the notice window closes, while you still have access.",
        type: "digital",
        estimatedMinutes: 10,
      },
      {
        order: 2,
        title: "Email your account manager a non-renewal notice",
        description:
          "Send written notice of non-renewal to your account manager and billing@, citing the 60-day notice clause in your MSA. Generate the 'Cancellation Demand' letter in the Letters tab.",
        type: "digital",
        estimatedMinutes: 10,
      },
      {
        order: 3,
        title: "Call the retention desk",
        description:
          "Call 1-800-555-0177 and navigate to the retention desk. State that you are giving notice of non-renewal — you are informing them, not asking permission.",
        type: "phone",
        estimatedMinutes: 20,
      },
      {
        order: 4,
        title: "Survive the counter-offers",
        description:
          "They will counter with a 30% discount for 12 months, then a seat reduction, then a 'pause'. Each acceptance re-locks the contract.",
        type: "phone",
        hoop: true,
        hoopScript:
          "Respond: 'Non-renewal is not negotiable. Please confirm the contract end date and final invoice amount in writing.'",
        estimatedMinutes: 10,
      },
      {
        order: 5,
        title: "Get written confirmation",
        description:
          "Require a written confirmation of the non-renewal date and the final invoice amount. No written confirmation means it is not canceled.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 6,
        title: "Remove the payment method",
        description:
          "After the final invoice is settled, delete the card on file and set a calendar reminder to verify the last invoice matches the confirmed amount.",
        type: "digital",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    slug: "telcomax",
    name: "TelcoMax Premium Bundle",
    merchant: "TELCOMAX THIRD-PARTY BILL",
    amount: 29.99,
    cadence: "monthly",
    category: "Telecom",
    icon: "cable",
    difficulty: 8,
    difficultyReason: "Third-party carrier billing — canceling inside the bundled apps does nothing. The charge lives on your carrier bill.",
    detectedVia: "bank",
    nextChargeInDays: 12,
    notes: "The bundle re-sells streaming services billed through your carrier. Canceling each app individually leaves the bundle charge intact.",
    cancellationMethod: "Carrier phone call + billing block",
    steps: [
      {
        order: 1,
        title: "Locate the third-party charges",
        description:
          "Open your TelcoMax bill and find the 'Premium Services' section. These charges are billed by TelcoMax on behalf of a bundler — the apps themselves have no idea this charge exists.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 2,
        title: "Call the third-party billing line",
        description:
          "Call 1-800-555-0134 and select billing > third-party charges. Do NOT select 'bundle support' — that team cannot remove the charges.",
        type: "phone",
        estimatedMinutes: 15,
      },
      {
        order: 3,
        title: "Decline the bundle discount",
        description:
          "The agent will offer 50% off the bundle for 6 months. Discounted bundles often silently re-commit you to a new term.",
        type: "phone",
        hoop: true,
        hoopScript: "Say: 'No thank you. I want the third-party charge removed from my line and a confirmation number.'",
        estimatedMinutes: 8,
      },
      {
        order: 4,
        title: "Request a content block",
        description:
          "Ask for a 'third-party billing block' (also called a content block or purchase blocker) on all lines so the charge can never be re-added.",
        type: "phone",
        estimatedMinutes: 5,
      },
      {
        order: 5,
        title: "Escalate if charges continue",
        description:
          "If next month's bill still shows the charge, file a carrier escalation and a dispute letter — use the 'Chargeback Notice' template in the Letters tab.",
        type: "digital",
        estimatedMinutes: 10,
      },
    ],
  },
  {
    slug: "legalplan",
    name: "LegalPlan+",
    merchant: "LEGALPLAN PLUS MONTHLY",
    amount: 24.95,
    cadence: "monthly",
    category: "Legal",
    icon: "scale",
    difficulty: 7,
    difficultyReason: "Paper cancellation form by mail only. Email and chat cancellations are explicitly not honored.",
    detectedVia: "bank",
    nextChargeInDays: 4,
    notes: "Signed up in 2022 after a free trial. The online portal has no cancel option at all.",
    cancellationMethod: "Mail-in form + phone confirmation",
    steps: [
      {
        order: 1,
        title: "Print and fill the cancellation form",
        description:
          "LegalPlan requires their paper cancellation form, downloadable from the member portal under Documents > Forms. Email cancellations are not honored.",
        type: "mail",
        estimatedMinutes: 10,
      },
      {
        order: 2,
        title: "Mail it certified",
        description:
          "Mail the completed form to the address printed on it, via certified mail with tracking, so you have proof of delivery within the notice period.",
        type: "mail",
        estimatedMinutes: 10,
      },
      {
        order: 3,
        title: "Call to confirm processing",
        description:
          "Wait 7 business days, then call 1-800-555-0119 to confirm the form was received and processed. Ask for the agent's name and a reference number.",
        type: "phone",
        estimatedMinutes: 10,
      },
      {
        order: 4,
        title: "Decline the rate lock",
        description:
          "The agent will offer to 'lock in your current rate for life'. The goal is cancellation, not a cheaper plan.",
        type: "phone",
        hoop: true,
        hoopScript: "Say: 'I am not negotiating the rate. I am confirming my cancellation. Can you confirm the effective date?'",
        estimatedMinutes: 5,
      },
      {
        order: 5,
        title: "Verify the final statement",
        description:
          "Check your next statement for a prorated final charge and nothing after it. Any new charge = dispute with your bank using the certified-mail receipt.",
        type: "digital",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    slug: "petbox",
    name: "PetBox",
    merchant: "PETBOX SUBSCRIPTION",
    amount: 39.0,
    cadence: "monthly",
    category: "Shopping",
    icon: "package",
    difficulty: 6,
    difficultyReason: "The cancel button is buried behind a 'Need help?' flow, phone queues loop, and shipped-box refunds have conditions.",
    detectedVia: "bank",
    nextChargeInDays: 9,
    notes: "Dog toy and treat box. You have received 11 boxes and the dog is not impressed anymore.",
    cancellationMethod: "Hidden web flow + phone fallback",
    steps: [
      {
        order: 1,
        title: "Find the buried cancel flow",
        description:
          "Account > Subscription > 'Need help?' > 'Cancel anyway'. The direct cancel link only appears after you decline the help options.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 2,
        title: "Call if the site loops",
        description:
          "If the flow keeps redirecting to the homepage, call 1-800-555-0186 with your order number ready.",
        type: "phone",
        estimatedMinutes: 10,
      },
      {
        order: 3,
        title: "Decline the stay-credit offer",
        description:
          "They will offer 'stay credits' worth 2 free boxes. That is another 2 months of billing commitment.",
        type: "phone",
        hoop: true,
        hoopScript: "Say: 'No credits, thank you — please cancel effective at the end of this cycle.'",
        estimatedMinutes: 5,
      },
      {
        order: 4,
        title: "Return the current box (optional)",
        description:
          "If this month's box already shipped, request a prepaid return label for a refund of that cycle.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 5,
        title: "Confirm the confirmation email",
        description:
          "You should receive a cancellation email within 24 hours. No email means not canceled — call back and escalate.",
        type: "digital",
        estimatedMinutes: 3,
      },
    ],
  },
  {
    slug: "newsdaily",
    name: "NewsDaily Digital",
    merchant: "NEWSDAILY DIGITAL",
    amount: 12.0,
    cadence: "monthly",
    category: "News",
    icon: "newspaper",
    difficulty: 5,
    difficultyReason: "Online cancel is grayed out for combined plans; retention line operates weekdays only with scripted offers.",
    detectedVia: "email",
    nextChargeInDays: 15,
    notes: "Intro rate expired long ago — you now pay full price for a plan you read twice a month.",
    cancellationMethod: "Phone during business hours",
    steps: [
      {
        order: 1,
        title: "Try the online form first",
        description:
          "Account > Manage subscription > Cancel. If your plan is a 'digital + print' combo, the online option will be grayed out — that is by design.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 2,
        title: "Call the retention line",
        description:
          "Call 1-800-555-0142 on a weekday between 9:00 and 17:00. Say: 'Please cancel my subscription effective at the end of the billing period.'",
        type: "phone",
        estimatedMinutes: 12,
      },
      {
        order: 3,
        title: "Refuse the free months",
        description:
          "They will offer 3 free months, then a Sunday-only discount. Decline both and ask for a cancellation reference number.",
        type: "phone",
        hoop: true,
        hoopScript: "Say: 'I understand, but I'd like to cancel. What is my cancellation reference number?'",
        estimatedMinutes: 5,
      },
      {
        order: 4,
        title: "Save the reference number",
        description:
          "Store the cancellation reference — it is your proof if charges continue next cycle.",
        type: "digital",
        estimatedMinutes: 3,
      },
    ],
  },
  {
    slug: "domainvault",
    name: "DomainVault Hosting",
    merchant: "DOMAINVAULT HOSTING",
    amount: 24.99,
    cadence: "monthly",
    category: "Web Services",
    icon: "server",
    difficulty: 4,
    difficultyReason: "Cancellation requires a support ticket plus phone confirmation, and data is purged 7 days after expiry.",
    detectedVia: "email",
    nextChargeInDays: 22,
    notes: "Hosts an old portfolio site you have not updated since 2023. Auto-renewal is on for hosting and 2 add-on domains.",
    cancellationMethod: "Support ticket + confirmation call",
    steps: [
      {
        order: 1,
        title: "Turn off auto-renew everywhere",
        description:
          "Domains section: disable auto-renew for the hosting plan AND each add-on domain you no longer need — they are billed separately.",
        type: "digital",
        estimatedMinutes: 8,
      },
      {
        order: 2,
        title: "Open a cancellation ticket",
        description:
          "Submit a cancellation ticket requesting account closure at the end of the current term. Keep the ticket ID.",
        type: "digital",
        estimatedMinutes: 10,
      },
      {
        order: 3,
        title: "Call to confirm the ticket",
        description: "Call 1-800-555-0155, confirm the ticket is being processed and ask for email confirmation.",
        type: "phone",
        estimatedMinutes: 8,
      },
      {
        order: 4,
        title: "Download your backups",
        description:
          "Download your site backups before the term ends — data is purged 7 days after expiry with no recovery.",
        type: "digital",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    slug: "vpnshield",
    name: "VPN Shield",
    merchant: "VPN SHIELD PREMIUM",
    amount: 7.99,
    cadence: "monthly",
    category: "Software",
    icon: "shield",
    difficulty: 3,
    difficultyReason: "Digital flow works, but the exit page pushes an aggressive 80% discount that quietly re-subscribes you.",
    detectedVia: "email",
    nextChargeInDays: 3,
    notes: "Billed monthly even though you signed up for the '3-year deal' — the deal renewed into a monthly plan.",
    cancellationMethod: "Digital",
    steps: [
      {
        order: 1,
        title: "Account > Billing > Cancel",
        description: "My Account > Billing > Cancel auto-renewal.",
        type: "digital",
        estimatedMinutes: 4,
      },
      {
        order: 2,
        title: "Decline the 80% off exit page",
        description:
          "The exit page offers 80% off for a year. Accepting it starts a NEW subscription, not a discount on the current one.",
        type: "digital",
        hoop: true,
        hoopScript: "Ignore the offer and click 'Confirm cancellation' — the button is deliberately small and gray.",
        estimatedMinutes: 3,
      },
      {
        order: 3,
        title: "Remove the payment method",
        description: "Remove your card so it cannot be charged when the promo logic misfires.",
        type: "digital",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    slug: "quicktax",
    name: "QuickTax Deluxe",
    merchant: "QUICKTAX DELUXE ANNUAL",
    amount: 79.0,
    cadence: "yearly",
    category: "Finance",
    icon: "calculator",
    difficulty: 3,
    difficultyReason: "Auto-renewal toggle is buried three menus deep and re-enables itself after any product update.",
    detectedVia: "bank",
    nextChargeInDays: 147,
    notes: "Annual charge of $79. You only file taxes once a year — there is no reason to keep it active year-round.",
    cancellationMethod: "Digital",
    steps: [
      {
        order: 1,
        title: "Disable auto-renewal",
        description: "Sign in > My Account > Preferences > Auto-renewal > Off.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 2,
        title: "Remove the saved card",
        description: "Billing > remove the card on file so a product-update toggle cannot charge it.",
        type: "digital",
        estimatedMinutes: 3,
      },
      {
        order: 3,
        title: "Download past returns",
        description: "Download your past tax returns for your records before the access period ends.",
        type: "digital",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    slug: "cloudnine",
    name: "CloudNine Storage 2TB",
    merchant: "CLOUDNINE STORAGE 2TB",
    amount: 9.99,
    cadence: "monthly",
    category: "Software",
    icon: "hard-drive",
    difficulty: 3,
    difficultyReason: "Straightforward digital flow, but files are deleted 30 days after downgrade — download first.",
    detectedVia: "appstore",
    nextChargeInDays: 17,
    notes: "2TB plan, you use 40GB. Downgrade or cancel — either way, download what you need first.",
    cancellationMethod: "Digital",
    steps: [
      {
        order: 1,
        title: "Download your files",
        description: "Download anything you need — files are permanently deleted 30 days after the plan ends.",
        type: "digital",
        estimatedMinutes: 5,
      },
      {
        order: 2,
        title: "Plan > Cancel",
        description: "Settings > Plan > Cancel subscription > choose 'delete at period end'.",
        type: "digital",
        estimatedMinutes: 3,
      },
      {
        order: 3,
        title: "Verify next month",
        description: "Confirm there is no charge on next month's statement.",
        type: "digital",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    slug: "streamflix",
    name: "StreamFlix+",
    merchant: "STREAMFLIX.COM",
    amount: 15.99,
    cadence: "monthly",
    category: "Streaming",
    icon: "clapperboard",
    difficulty: 2,
    difficultyReason: "Standard digital flow — just three retention screens to click through.",
    detectedVia: "email",
    nextChargeInDays: 2,
    notes: "Standard plan. You watch one series per year, on someone else's account anyway.",
    cancellationMethod: "Digital",
    steps: [
      {
        order: 1,
        title: "Settings > Account > Cancel Membership",
        description: "Click your avatar > Account > Cancel Membership.",
        type: "digital",
        estimatedMinutes: 3,
      },
      {
        order: 2,
        title: "Click through the retention screens",
        description:
          "You will see 'Are you sure?', then 'Pause instead?', then a cheaper plan offer. Click 'Finish cancellation' on every screen.",
        type: "digital",
        hoop: true,
        hoopScript: "Keep clicking 'Finish cancellation' — the button text changes on each screen but it is always bottom-right.",
        estimatedMinutes: 2,
      },
      {
        order: 3,
        title: "Confirm the email",
        description: "Check for the confirmation email. Access continues until the end of the paid period.",
        type: "digital",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    slug: "audiowave",
    name: "AudioWave Music",
    merchant: "AUDIOWAVE MUSIC",
    amount: 10.99,
    cadence: "monthly",
    category: "Streaming",
    icon: "music",
    difficulty: 2,
    difficultyReason: "Standard App Store flow — cancel in two taps.",
    detectedVia: "appstore",
    nextChargeInDays: 25,
    notes: "Family plan you are paying for alone.",
    cancellationMethod: "Digital (App Store)",
    steps: [
      {
        order: 1,
        title: "App Store > Subscriptions",
        description: "Open App Store > tap your profile > Subscriptions > AudioWave > Cancel Subscription.",
        type: "digital",
        estimatedMinutes: 3,
      },
      {
        order: 2,
        title: "Confirm",
        description: "Confirm the cancellation. Access continues until the end of the period.",
        type: "digital",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    slug: "fitjournal",
    name: "FitJournal Pro",
    merchant: "FITJOURNAL PRO",
    amount: 4.99,
    cadence: "monthly",
    category: "Health",
    icon: "activity",
    difficulty: 2,
    difficultyReason: "Standard App Store flow with one 'cancel to save 50%' discount page.",
    detectedVia: "appstore",
    nextChargeInDays: 8,
    notes: "Trial that converted 11 months ago. Opened twice.",
    cancellationMethod: "Digital (App Store)",
    steps: [
      {
        order: 1,
        title: "Settings > Subscriptions",
        description: "Open Settings > tap your name > Subscriptions > FitJournal Pro > Cancel Subscription.",
        type: "digital",
        estimatedMinutes: 3,
      },
      {
        order: 2,
        title: "Decline the save-50% page",
        description:
          "They will show a 'cancel to save 50%' page. Accept only if you genuinely want to keep it — otherwise confirm the cancellation.",
        type: "digital",
        hoop: true,
        hoopScript: "Tap 'Continue to cancel'. The 50% offer is a new 12-month commitment.",
        estimatedMinutes: 2,
      },
    ],
  },
]

export function monthlyNormalized(amount: number, cadence: string): number {
  return cadence === "yearly" ? amount / 12 : amount
}
