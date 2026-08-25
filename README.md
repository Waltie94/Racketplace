# RacketPlace V1

RacketPlace is a marketplace-first website for secondhand racket-sports gear in South Africa.

## Launch sports
- Tennis
- Padel
- Pickleball
- Squash

## V1 features
- Marketplace-first homepage
- Sport and category filters
- Seller listing flow
- Up to 5 compressed listing photos
- Sport-specific listing selection
- Seller payout estimator
- RacketPlace 6% marketplace commission
- Payfast fee estimate for cards and Instant EFT
- Buyer cart for secondhand listings
- One-seller-at-a-time checkout
- Payfast payment handoff endpoint
- Payfast ITN signature verification
- Local JSON database for development

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and add your Payfast Sandbox credentials when ready.
3. Run `npm start`.
4. Open http://localhost:3000.

For Payfast ITN testing, `RACKETPLACE_BASE_URL` must be a publicly reachable HTTPS URL.

## Important
The seller payout shown in the browser is an estimate. The production backend must calculate the authoritative amount from the transaction data and actual Payfast fees. Do not commit Payfast Merchant Keys or Passphrases to source control.
