# Coy Product Assignment — Submission

## Part A — Product understanding and two feature recommendations

### Understanding the existing product

Coy is a double-blind crush-matching product for adults (18+). A user adds someone they already know using a phone number or email address. The other person may receive an anonymous heads-up, but the identity of the person who added them is not disclosed. The two people learn who added whom only when both add each other. Coy intentionally avoids public profiles, photos, swiping and in-app chat; the core value is private, mutual confirmation rather than browsing strangers.

The product also has a limited number of slots. The public product information describes three free slots, paid one-time extra slots, and a referral reward: invite three friends who join and add a crush to earn one slot. Adding is deliberately difficult to reverse: removal can lock the slot for 30 days, which helps prevent users from testing a list of suspected admirers. Unmatched entries are subject to a 180-day deletion period. Coy is 18+ and offers opt-out controls for people who receive heads-up messages.

### Feature 1 — Invite and reward progress tracker

**What it does**
- Show the user's invite link with a one-tap copy/share action.
- Show referral progress in plain language, such as `2 of 3 eligible friends completed`.
- Explain the qualifying action (the invited friend joins Coy and adds a crush).
- Confirm when a reward slot has been credited and show the updated available-slot count.
- Keep the status aggregate. Never reveal an invitee's crush list, who they added, or any private matching activity.

**Why it is required**
Coy's referral reward depends on more than someone simply opening an invite link: the invited friend must join and add a crush. Without progress or eligibility feedback, users may not understand why a referral has not counted or when the free slot will arrive. A transparent tracker reduces uncertainty, makes the reward feel attainable, and can encourage organic growth. Keeping the display aggregate preserves Coy's privacy promise.

**Success measure**
Increase in invite-to-qualified-signup conversion and reduction in support questions about missing referral rewards.

### Feature 2 — Safety, consent and privacy centre

**What it does**
- Provide one clearly labelled place for email verification status, notification preferences, message opt-out guidance and account deletion.
- Explain what happens when a person is added, what the anonymous heads-up contains, and exactly when identities/contact details are revealed.
- Provide a straightforward report/block or abuse-help route, with clear handling for unwanted or mistaken additions.
- Remind users that Coy is for adults and that they should only add people they know and would be comfortable matching with.

**Why it is required**
Coy uses personal contact details to make matches and sends messages to people who may not yet have joined. That creates privacy and consent edge cases: mistaken contact details, unwanted messages, harassment, and uncertainty about what a match reveals. A single, easy-to-find control centre makes user choices understandable, helps recipients stop messages, and reinforces trust in the double-blind design. It also reduces the risk that a user misunderstands the consequences of adding someone.

**Success measure**
Higher completion of email verification, lower opt-out-related support volume, and faster resolution of abuse/privacy reports.

### Research limitation / verification note

This write-up is based on Coy's publicly available product description, help content, terms and privacy policy. I could not personally complete the authenticated phone-OTP and email-verification flow in this environment because it requires a real phone number, OTP receipt and account actions. I also did not purchase extra slots. Before submitting, I would complete the requested in-app walkthrough using my own account and add first-hand observations about the exact screens, copy, invite flow and extra-slot screen. I have not represented those steps as personally completed.

Public references:
- https://getcoy.com/
- https://getcoy.com/blog/how-coy-works
- https://getcoy.com/blog/is-coy-safe
- https://getcoy.com/terms
- https://getcoy.com/privacy

---

## Part B — Discover tab implementation

### Overview

A standalone, mobile-first React application with a simple Home placeholder, Discover swipe experience and Matches view. The backend is Node.js/Express and persists a single demo user's swipes in a JSON file.

### Requirements covered

- 30 mock profiles with name, age, photo URL, bio, city and interests.
- Some profiles are seeded with a server-side `likesYou` flag so the demo can produce mutual matches.
- One profile is shown at a time.
- Drag right to like and left to pass; desktop Like and Pass buttons are available.
- Swiped profiles are removed from the feed and are not returned again.
- Mutual matches display a match celebration and appear in the Matches view.
- A one-sided incoming like is never exposed. The `likesYou` property is stripped from every public profile response; there is no incoming-likes endpoint or count.
- Swipes persist in `server/data/state.json` across reloads and server restarts.
- Empty, loading and error states are included.

### API contract

| Method | Endpoint | Behaviour |
|---|---|---|
| GET | `/feed` | Return profiles the demo user has not swiped on; omit private incoming-like data. |
| POST | `/swipe` | Accept `{ "profileId": "p01", "action": "like" }` or `pass`; reject invalid and duplicate swipes; return match status. |
| GET | `/matches` | Return only profiles where the demo user liked them and their seeded like is mutual. |
| GET | `/health` | Basic API health check. |

### Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

### Tests

Run:

```bash
npm test
```

The Node test suite covers feed privacy, mutual matching, one-sided like privacy, duplicate swipe rejection and invalid actions. The test suite restores the previous JSON state after running.

### Reset the demo

Stop the backend and set `server/data/state.json` to:

```json
{"swipes":[]}
```

Restart the backend. Seeded mutual-like profiles include `p01`, `p03`, `p06`, `p09`, `p12`, `p15`, `p18`, `p21`, `p24`, `p27` and `p30`.

### Known demo limitations

- This is a single-user assignment demo; it has no external authentication.
- JSON-file persistence is suitable for a local demo, not concurrent production traffic.
- Production deployment should use a transactional database, per-user authorization, rate limiting, request validation, age gating, abuse reporting/blocking, secure contact handling and audit-safe privacy controls.
- The project has not been deployed to a public URL. Create a public GitHub repository and push the project before sharing the repository link.
