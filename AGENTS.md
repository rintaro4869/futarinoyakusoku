# Pairlog Agent Guide

Read this file before making changes in this repository.

## Existing Project Rules
- Also read [`CLAUDE.md`](/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/CLAUDE.md) first.
- Do not weaken the security constraints already documented there.

## Design Reference
- For any landing page, marketing page, pricing page, onboarding page, or other design-heavy UI task, always consult VoltAgent's `awesome-design-md` before proposing or implementing UI changes:
  - Repository: `https://github.com/VoltAgent/awesome-design-md`
  - Default Pairlog references:
    - `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/clay/DESIGN.md`
    - `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/apple/DESIGN.md`
    - `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/airbnb/DESIGN.md`

## Pairlog Design Direction
- Use `clay` for soft gradients, organic background shapes, and art-directed section atmosphere.
- Use `apple` for whitespace, product framing, premium composition, and clear product-first storytelling.
- Use `airbnb` for warm CTA treatment, friendly card surfaces, and approachable conversion-focused hierarchy.
- Do not ship a generic Tailwind landing page. The interface should feel intentional, premium, warm, and mobile-first.
- Keep the App Store CTA in the most visually prominent position on marketing pages.
- Maintain parity between Japanese and English marketing pages unless the task explicitly says otherwise.

## SEO And Content Rules
- Landing pages must include strong metadata, canonical URLs, language alternates, and accurate copy.
- Do not claim the iOS app is live if the App Store review is still pending.
- Keep FAQ, safety language, and download state consistent with the actual product status.
