# Clean product links
- [x] Assign stable, unique title-based addresses to existing and future products.
- [x] Preserve legacy links, affiliate tracking and product access; update sharing and SEO.
- [x] Test clean links, redirects, sharing and sitemap.

# Professional creator entry experience
- [x] Redesign homepage and shared visual treatment without artificial imagery or invented claims.
- [x] Add clear selling and browsing paths, real free guide and concise selling steps.
- [x] Verify mobile and desktop browsing, guide access and signup navigation.

# First 30 creators launch offer
- [x] Award one permanent numbered place per creator after their first approved product, capped at 30.
- [x] Show a truthful live counter, concise launch-offer copy and highlighted creators on the homepage.
- [x] Add clear offer terms and verify awarding, capacity and mobile/desktop presentation.

# Simpler registration
- [x] Put Google sign-up above the e-mail form.
- [x] Reduce e-mail registration to e-mail, one visible-password field and one combined consent.
- [x] Verify desktop/mobile registration and its authentication request.

# Concise operator presentation
- [x] Remove the operator details block from the shared footer, retaining legal links and contact.
- [x] Remove REGON and repeated operator definitions; retain name, address, NIP and contact in legal documents.
- [x] Verify the footer and legal documents on desktop and mobile.

# Digital-content legal documentation
- [x] Correct the terms, privacy policy and help for digital-file delivery without physical-goods DAC7 reporting claims.
- [x] Verify the updated public documents; leave tax monitoring, payments and stored data unchanged.

# Current legal bases and consistent dates
- [x] Align document dates with the confirmed launch and separately identify the revision date.
- [x] Update PKE, consumer-redress references and privacy disclosures to match installed tools and analytics settings.
- [x] Verify public documents and date rules without changing payments or data collection.

# Security audit
- [x] Check live RLS, grants, private storage and authenticated file access.
- [x] Harden exposed product columns, order writes and Stripe event verification; test rejected requests (HTTP 400) and complete authenticated sandbox checkout/download verification.
- [x] Review completed deep scan; fix exchange authorization, guest identity exposure, scan paths and Stripe return origins.

# Authenticated purchase and download audit
- [x] Verify authenticated sandbox card checkout, downloaded PDF (540538 bytes), purchase in dashboard, signed-out denial and forged webhook HTTP 400.
- [x] Fix payment transport, guest identity verification and stale download authorization.
- [x] Run regression tests; real-money payments and physical-device checks remain outside this sandbox verification.

# Restore authenticated catalogue visibility
- [x] Remove the recursive administrator permission check without broadening data access.
- [x] Verify products and featured creators while signed in, without purchases or notifications.

# Edit own listings
- [x] Add editing from own products, reusing all existing listing fields and retaining existing uploads.
- [x] Protect owner-only saves and retain moderation and immutable shared links.
- [x] Test validation and verify an authenticated edit/save through the interface.

# Fairer dispute terms
- [x] Remove the contractual penalty and set platform dispute resolution at 7 business days.
- [x] Verify the revised terms and prepare the creator message.

# Automatic guest account creation
- [x] Replace manual-signup redirection with automatic passwordless account creation from the guest email.
- [x] Return the verified buyer to the same product and test the complete guest entry flow.

# Product price reductions
- [x] Undo price-reduction display and tracking at the user's request, preserving guest checkout.
- [x] Verify original prices and unchanged guest checkout (10 rule tests; catalogue/product browser check without ordering).
