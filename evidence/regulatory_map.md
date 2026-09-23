# Regulatory Map by Region

Owner: Architects (privacy design) with product owner and counsel. **Status: agent-prepared orientation, not legal advice.** Every row needs confirmation by qualified counsel before launch in that region (OQ-04).

## Design stance that simplifies compliance (MVP)

- **All data stays on the device.** The operator collects no personal data in the MVP. There is no account, no sync, no analytics and no ads.
- The only optional network call is the opt-in LLM coach. It sends the question text and approved passages, never the child's profile or logs, and it is **off by default**.
- **Intended use:** education and wellness support for caregivers. The app does not diagnose, treat, or claim to change autism, and it is not intended as a medical device.

## Privacy law

| Region | Law / instrument | Key obligations for this product | Product response |
| --- | --- | --- | --- |
| Singapore (launch 1) | PDPA 2012; PDPC Advisory Guidelines on children's personal data (2024) | Consent from a parent for children under 13; notify purpose; protection; retention limitation; DPO; breach notification | Consent screen; purpose notice; local storage; retention defaults; DPO contact in the privacy notice (OQ-05) |
| Philippines (launch 1) | Data Privacy Act 2012 (RA 10173), IRR, NPC circulars | Sensitive personal information includes health, so health-adjacent logs need lawful basis (consent); register with NPC if thresholds are met; DPO; breach notification within 72 h | Treat logs as sensitive; explicit consent; DPO; NPC registration check |
| United States | COPPA Rule (amended 2025; compliance date April 2026) | Verifiable parental consent before collecting data from children under 13; written data-security programme; retention policy; limits on third-party disclosure | MVP: operator collects nothing. Before sync: choose a VPC method (OQ-03) and publish a retention policy |
| United States | State health-data and children's laws (e.g. WA My Health My Data, CA CCPA/CPRA, age-appropriate design laws) | Consumer health data consent; minors' data limits | Same local-first stance; review before sync |
| United Kingdom | UK GDPR, DPA 2018, ICO Age Appropriate Design Code | Best interests of the child; high-privacy defaults; DPIA; no nudge techniques; data minimisation; parental controls transparency | DPIA to be written (OQ-06); defaults already high-privacy; no streaks or nudges |
| European Union (if reached) | GDPR Art. 8 and Art. 9 (health data) | Parental consent under 13–16 depending on the member state; explicit consent for health data; DPIA | As above |
| Australia | Privacy Act 1988 (APPs); Children's Online Privacy Code being developed by the OAIC after the 2024 amendments | APP 3 and 6 (health information is sensitive); code obligations once registered | Monitor the code; local-first design |

## Medical-device and software regulation (intended-use check)

| Region | Regulator | Watch-out |
| --- | --- | --- |
| Singapore | HSA (Health Products Act; SaMD guidance) | Claims to treat or monitor a condition can make the software a medical device |
| Philippines | FDA Philippines (CDRRHR) | As above |
| United States | FDA (General Wellness policy; clinical decision support guidance) | Stay in general wellness: no disease-treatment claims |
| United Kingdom | MHRA (software and AI as a medical device) | As above |
| Australia | TGA (SaMD; excluded software categories) | As above |

## Platform rules

- Apple App Store Kids Category and Guideline 1.3 / 5.1.4: no third-party analytics or ads; parental gate before external links or purchases. The app has a parental gate on Child Mode exit and gates all external links in Parent Mode.
- Google Play Families Policy: Families-certified SDKs only (the app uses none); follow the Teacher Approved guidance if it is sought.

## Accessibility law

WCAG 2.2 AA is the target. It also meets the EU Accessibility Act, ADA expectations, and Australia's DDA guidance.
