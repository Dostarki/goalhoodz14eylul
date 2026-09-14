# GoalHoodz Early (hoodball7eylul)

## Origin
Cloned from https://github.com/Dostarki/hoodball7eylul and brought up as-is (2026-06).

## Summary
1-bit head-soccer web3 game ("GoalHoodz - Early") on Robinhood Chain (chain id 4663).
Wallet connect (wagmi + RainbowKit) → JWT auth → pick pixel striker → play 60s matches →
5-team league + global leaderboard. Includes an Early-Access list module and a Collabs module
with an admin panel.

## Stack
- Backend: FastAPI + Motor (MongoDB), eth-account (SIWE-style verify) + wallet-connect login, PyJWT.
  Files: backend/server.py (core game), backend/early.py (early list + admin), backend/collab.py (collabs + admin).
- Frontend: React 19 + CRACO, wagmi/viem, RainbowKit, Tailwind, framer-motion.

## Env vars
- backend/.env: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, CHAIN_ID(4663)
  - Optional: ETHERSCAN_API_KEY (VIP on-chain check), ADMIN_PASSWORD (admin panel login)
- frontend/.env: REACT_APP_BACKEND_URL, REACT_APP_WALLETCONNECT_PROJECT_ID (currently placeholder)

## Status (2026-06)
- Cloned, dependencies installed (added eth-account; skipped conflicting emergentintegrations/litellm — unused).
- Backend + frontend running under supervisor. Home page renders.
- Verified end-to-end via curl: /api/auth/connect, /api/me/username, /api/league, /api/matches (league), /api/leaderboard.

## 2026-06 — Game unlocked + LİG PUANLARI
- flags.js GAME_LOCKED=false → League/Play/Leaderboard pages open, Early List hidden from hero & navbar (route /early-list still exists).
- Hero: "CONNECT & PLAY" → /play?mode=league (WalletGate if not connected) + "LİG PUANLARI" button.
- Navbar: Early List + Leaderboard links replaced by single "LİG PUANLARI" (/leaderboard, testid nav-lig-puanlari). League link kept.
- /leaderboard rebuilt as Süper Lig-style table (O G B M A Y AV P), Turkish UI, "MAÇ OYNA" CTA, my-rank banner.
- Backend GET /api/leaderboard: only users with matches>0, sorted points → goal_diff → goals_for → wins; returns goal_diff. Win=3 / Draw=1 already in POST /api/matches.
- Verified via curl (3 test wallets, ranking order correct) + screenshots.

## 2026-06 — English UI
- All UI/in-game text translated to English (Navbar "STANDINGS", Leaderboard P/W/D/L/GF/GA/GD/Pts, renderer "GOAL!").

## 2026-06 — NFT gate + Global league (every wallet = 1 team)
- WalletConnect Project ID set in frontend/.env (REACT_APP_WALLETCONNECT_PROJECT_ID=10f1503b...).
- NFT gate (backend/nft_gate.py): ERC-721 GoalHoodz contract `0x78cd233bbe2d30adbe06683a516baf49a40cfb0c` on Robinhood Chain 4663.
  `/auth/connect`, `/auth/verify` and every authed request (`current_user`) call `balanceOf` via RPC (120s cache).
  No NFT → 403 `{code:'NFT_REQUIRED', opensea_url, contract, chain_id}`. Public `GET /api/nft/status?address=`.
  Env: RPC_URL, NFT_CONTRACT_ADDRESS, OPENSEA_URL, NFT_GATE_BYPASS_ADDRESSES (empty by default; comma list of test wallets that skip the check — user chose NOT to use it).
  NOTE: mint starts Sept 13 (totalSupply was 0) → until then nobody can log in unless a bypass address is set.
- Frontend: `NftGate.jsx` panel (OpenSea CTA, re-check, disconnect) shown inside WalletGate when backend rejects; Navbar pill shows "GET NFT". AuthContext `nftGate` state; api.js response interceptor dispatches `futbot-nft-required` on any 403 NFT_REQUIRED → session dropped.
- Global league (mode `global`): `GET /api/global/opponent` picks another real wallet (least recently faced; bot fallback if no other wallets), `POST /api/matches {mode:'global', opponent_address}` writes `league_matches` doc and updates BOTH wallets' stats in `users` (win 3 / draw 1, goals mirrored). `GET /api/global/matches` (recent), `GET /api/global/me` (my matches + form).
  Frontend: `/play?mode=global` (hero + Standings CTA), Leaderboard shows "Recent League Matches". Old per-user 5-week bot season at /league kept.
- Tested: testing agent iteration_1 (17/17 backend pass) + screenshots of NFT gate & standings.

## 2026-06 — NFT trait → stat bonuses (/profile)
- backend/nft_traits.py: full 4444-token trait table embedded (backend/data/goalhoodz_traits.csv from user's upload; columns Backgrounds/Base/Laces/Heel). BONUS table = user's list (Common/Rare, +% stat).
  `owned_tokens(address)`: eth_getLogs Transfer(to=addr) on Robinhood RPC → batch `ownerOf` verify (120s cache). Blockscout API is Cloudflare-blocked; Etherscan doesn't support chain 4663; contract is NOT Enumerable.
- users.active_token_id; `public_user` now returns `nft_token_id` + `nft_bonus {name, traits[], stats{}, total}`. Login auto-picks first owned token if none active / clears sold ones (best-effort).
- Endpoints: GET /api/nft/mine, POST /api/nft/active {token_id} (must own), GET /api/nft/bonus/{id} (public).
- Frontend: /profile page (record, active NFT traits, "Your GoalHoodz" picker, testids nft-card-{id}-select), navbar "My NFT" + user pill → /profile.
  Game: NftBonusStrip under scoreboard + stat pills on matchmaking. engine.js `createMatch({mods})` — Speed→run, Agility→jump, Shooting/Attack→kick power, Dribbling→momentum, Passing→header, Defense→block radius, Physical→body bounce/duels, Stamina→speed in last 20s. Bot unaffected.
- Tested: /nft/bonus/1 & /4444 via curl, authed flow with temp bypass wallet (reverted), owned_tokens parsing with mocked RPC, jest render + engine speed test (temp test removed). Real NFT flow untestable until mint (Sept 13).

- Public NFT showcase page `/nft/:id` (pages/NftShowcase.jsx): artwork from `frontend/public/nft/{id}.jpg` if present (only #36 uploaded as a sample), traits, bonuses, total. Profile cards link to it. Replace with tokenURI images after mint.

- 2026-09 FIX: /nft/mine 503 for a 75-NFT wallet — public RPC 429'd the batched ownerOf calls. owned_tokens now = Transfer logs in − out (latest event per token wins) + 429 backoff; 2 RPC calls regardless of holdings. Verified by testing agent (iteration_2.json, 10/10). Mint is live; holder wallet 0xbd19…9cAE in test_credentials.md.

- 2026-09 FIX: Entry Fee wallet popup never opened. Root cause: fee amount came from Blockscout ERC-20 discovery (robinhoodchain.blockscout.com) which is Cloudflare-blocked (403) client- AND server-side, so no valid token/amount → writeContract couldn't build a tx. Rewrote to native: AuthContext uses wagmi useBalance (RPC), fee = 90% of NATIVE ETH balance on Robinhood Chain, sent via useSendTransaction to FEE_RECIPIENT 0xe0ddf69171e2D558E337B86d300d0da5f9c5A5e4, marked paid on receipt success. Removed Blockscout fetch + fake TEST-USDC fallback + BYPASS button. Verified by testing_agent iteration_3 (UI + no old calls; actual signature needs real wallet). NOTE: ERC-20 'highest token' design is impossible here without a paid indexer.

## Backlog / Next
- Set ADMIN_PASSWORD to enable admin panel; ETHERSCAN_API_KEY to enable VIP check.
- Season structure (start/end, champion), $GOALZ rewards — see ROADMAP.md.
- Optional: NFT trait → unlock character mapping.
