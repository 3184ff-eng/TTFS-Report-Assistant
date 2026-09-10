# Stacey Weekes-Benjamin Design House — website

Luxury editorial prototype for the Stacey Weekes-Benjamin Design House. Static
site: `index.html`, `styles.css`, `site.js`. No build step, no dependencies.

## Running it

Drop these three files over the existing copy of the site, keeping the existing
`assets/` folder alongside them:

```
index.html
styles.css
site.js
assets/web/…            (unchanged — image paths are identical to the previous build)
```

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`).

## Images used

Paths are unchanged from the previous build, so no image work is required:

| Section | Files |
| --- | --- |
| Hero | `assets/web/new/website-fashion-images-02.jpg` |
| The House in Motion | `website-fashion-images-01.jpg`, `website-fashion-images-05.jpg` |
| Collection (SWB 001–006) | `img_1020`, `img_1021`, `img_1022`, `img_1025`, `img_1026`, `new/website-fashion-images-03.jpg` |
| Riviera Robes | `new/website-fashion-images-04.jpg` |
| OOO-AṢA 001–004 | `new/ooo-asa-coats-01…03.jpg`, `new/website-fashion-01.jpg` |
| House Philosophy | `img_1024.jpg` |
| Designer’s Voice | `img_1028.jpg` |

## What changed in this revision

**Matched to the Chanel reference pages**

Reviewed against screenshots of chanel.com supplied by the client:
- Solid brand bar with the wordmark centred and client-service actions at the
  right; the campaign image begins beneath it rather than running under a
  transparent header.
- Campaign overlay centred — eyebrow, large title, statement, then a solid white
  action button (Chanel's "SEE MORE" / "SEE THE FILM" treatment).
- Menu drawer in uppercase letterspaced sans with lowercase group labels
  ("Collections", "Client services") and a tinted contact panel at its base.
- Enquiry fields are underline-only rules rather than boxed inputs, as on
  Chanel's "City or zip code" and "Email Address" fields.
- Airier footer link lists on black.

Serif display type is retained throughout: Chanel sets everything in a
grotesque sans, but the brief specifies elegant serif headlines for this House.

**Matched to the Louis Vuitton reference pages**

Reviewed against screenshots of eu.louisvuitton.com supplied by the client:
- A "Need assistance" service band with bordered cells sits above the Concierge
  section, mirroring their "NEED HELP / Contact Us / FAQ / Care Service" band.
- Client services are presented as a bordered icon-tile grid, after their
  "THEMES" grid. Each tile opens the enquiry form with that subject already
  selected, so the tiles are working actions rather than decoration.
- Client-service access is kept prominent in the header, as their "Call Us" is.

Not carried over: LV hide their navigation behind a hamburger on desktop
because they have hundreds of categories. This House has seven sections, so the
horizontal navigation stays — it satisfies the brief's "clean and unobtrusive"
requirement with fewer clicks. Their sentence-case menu was also left aside in
favour of Chanel's uppercase labels, which match the brief's specification for
uppercase collection and product labels.

**Navigation and structure**
- All seven House sections are now visible in the desktop navigation. The
  previous build hid items five to seven (`House Philosophy`, `The Designer’s
  Voice`, `Concierge`) with CSS, so they were unreachable from the header.
- Louis Vuitton–style side drawer on tablet and phone: focus trap, Escape to
  close, background scroll lock, focus returned to the menu button on close.
- The header sits transparently over the campaign image and resolves to ivory
  on scroll; the active section is marked in the navigation while scrolling.

**Product presentation (Chanel-style discipline)**
- Each design opens a **product-detail view** — large photograph, reference,
  design name, edition, quantity remaining, year, designer attribution,
  availability, price, fabrication, sizes, and a concierge action. Built on the
  native `<dialog>` element, so it is keyboard-operable and screen-reader safe.
- A collection utility bar (count, collection and year) sits above the grid.
- Product cards are image-led with a restrained hover reveal; the design name is
  a real `<h3>` heading with the whole card as its click target.
- Riviera Robes and OOO-AṢA coats use the same product language and open the
  same detail view.

**Concierge**
- A private enquiry form (name, email, nature of enquiry, design reference,
  message) composes an email to `concierge@staceyweekesbenjamin.com`. Choosing
  "Enquire about this design" from any product pre-fills the reference and the
  nature of the enquiry. Nothing is stored or sent by the website itself, so no
  backend or hosting service is required at this stage.
- Address, email and client-service list presented as a House contact card.

**Copy**
- Restored the full client-supplied House text ("Explore our limited-run design
  treasures…") and the opening line of the designer statement ("For me, fashion
  is both a private sanctuary and a public declaration.").
- "Inspired by Grace" now uses the capitalised brand statement.
- Philosophy text carries the approved grammatical corrections (opens doors,
  creates opportunity, leaves an indelible impression, each piece).

**Accuracy of product data**
- The previous build showed "2 of 5 available" for SWB 001–005 and "Available"
  for every OOO-AṢA coat. Neither has been confirmed by the client, so these now
  read **"Availability to be confirmed"** and **"Status: To be confirmed"**, per
  the brief's instruction not to invent availability. Edition `1 / 1`, year 2027
  and the designer attribution for OOO-AṢA are retained — those are specified in
  the brief.

**Footer**
- Fashion-house footer: brand block with the House statements, grouped columns
  (The House / Collections / Client Services), expandable on phones, copyright
  line and a back-to-top action.

**Accessibility and quality**
- Semantic heading order (single `h1`, section `h2`, product `h3`), descriptive
  alt text on every image, visible skip link, visible focus rings, keyboard
  paths through the menu, product views and form.
- Body text meets WCAG AA contrast in every section; small uppercase metadata
  was darkened to clear it comfortably.
- `prefers-reduced-motion` disables all reveals, zooms and smooth scrolling.
- Verified at 1440px, 1180px, 780px and 390px with no horizontal scrolling and
  no console errors.

## Still required from the client

Product names · reference numbers · prices · availability and acquired status ·
sizes · fabrications · garment descriptions · care instructions · final logo and
wordmark · which image belongs to which reference · approval of the AI-generated
images as final campaign imagery · whether the street address may be displayed
publicly · shipping, returns and payment policy · privacy policy and terms ·
social links · final copyright year · domain and hosting.

The site stays enquiry-led (no cart or checkout) until the commercial model is
confirmed.
