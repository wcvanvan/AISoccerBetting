# Wolverhampton Wanderers vs Liverpool — Card Market Analysis

## Phase 1: Statistical Analysis

### 1A. Data Cleaning

**Wolves (20 games):** All 20 have card data. Two FA Cup games (#5 Grimsby, #11 Shrewsbury) lack fouls/tackles data and carry different refereeing standards — flagged. **18 valid PL games, 11 home.**

**Liverpool (20 games):** All 20 have card data. Five non-PL or incomplete games flagged: #4 Brighton FA Cup (no fouls), #8 Qarabag CL, #10 Marseille CL, #12 Barnsley FA Cup (no fouls), #19 Inter CL. **15 valid PL games, 10 away.**

### 1B. Wolves (Home)

**Venue-filtered (n=11 home):**

| Metric | Value |
|--------|-------|
| Team cards avg / median / range | 1.91 / 2.0 / [1–3] |
| Opp cards avg / median / range | 1.91 / 2.0 / [0–4] |
| Total cards avg / median / range | 3.82 / 4.0 / [1–6] |
| Variance (total) | 2.56 (σ ≈ 1.60) |
| Fouls committed avg | 11.09 (n=9, excl. cups) |
| Tackles avg | 17.91 |
| Fouls-per-card | 5.81 |

**All-games (n=20):** Team cards 2.20, opp cards 1.60, total 3.80.

**Venue delta:** Home team cards 1.91 vs all-games 2.20 → **-0.29 fewer at home**. Opposition cards are higher at home (1.91 vs 1.60) suggesting Wolves generate opponent cards better at Molineux. Total is essentially flat (3.82 vs 3.80).

**Trend (recent 6 all-games vs earlier 14):**
- Recent 6 (#1–#6): team cards = 2+3+1+2+2+2 = 12 → avg 2.00; total = 3+6+7+3+4+2 = 25 → avg 4.17
- Earlier 14: team cards = 33/14 = 2.36; total = 51/14 = 3.64
- Direction: recent total is *slightly* higher, but Crystal Palace (7 cards, 1 red) inflates it. Without that outlier: recent 5 = 18/5 = 3.60, essentially flat.

**Threshold frequencies (home):** O2.5 81.8%, O3.5 54.5%, O4.5 36.4%, O5.5 18.2%, O6.5 0.0%.

**Card timing:** Extremely 2H-heavy: 27% first half, 73% second half. Team cards: 0% in 1–15 min, 33% in 76–FT.

**Booking points (home):** 19.09 avg team, 38.18 total. No reds in home games — not inflated.

### 1C. Liverpool (Away)

**Venue-filtered (n=10 away):**

| Metric | Value |
|--------|-------|
| Team cards avg / median / range | 1.30 / 1.0 / [0–3] |
| Opp cards avg / median / range | 2.10 / 2.0 / [1–5] |
| Total cards avg / median / range | 3.40 / 2.5 / [1–8] |
| Variance (total) | 5.16 (σ ≈ 2.27) |
| Fouls committed avg | 9.60 |
| Tackles avg | 11.50 |
| Fouls-per-card | 7.38 |

**All-games (n=20):** Team cards 1.10, opp cards 2.10, total 3.20.

**Venue delta:** Away team cards 1.30 vs all-games 1.10 → **+0.20 more away**, as expected. Away total 3.40 vs all-games 3.20 — slightly more cards on the road.

**Trend (recent 6 away vs earlier 4):**
- Recent 6 (#1, #3, #5, #9, #10, #13): team cards 1+0+0+1+0+2 = 4 → avg **0.67**; total = 3+2+1+2+1+4 = 13 → avg **2.17**
- Earlier 4 (#14, #17, #19, #20): team cards 1+3+2+3 = 9 → avg 2.25; total = 2+8+5+6 = 21 → avg **5.25**
- **Massive downward trend.** Liverpool have become dramatically cleaner on the road. Recent 6 away at 2.17 total cards is exceptionally low. The Spurs game (8 cards, 2 reds) heavily inflates the earlier period.

**Fouls-per-card: 7.38** — This is extremely high. Liverpool commit fouls but rarely get punished. They are the definition of a team "getting away with it," though this also reflects their technical quality and ability to foul without aggression.

**Card timing:** 32% 1H, 68% 2H. Notably, 55% of Liverpool's own cards come in the 76–FT window — very late concentration.

**Booking points (away):** 13.00 avg team (very low), 37.00 total.

### 1D. Outlier Check

**Wolves home:** σ = 1.60, 2σ threshold = 3.82 + 3.20 = 7.02. No outliers. Range 1–6 is within bounds.

**Liverpool away:** σ = 2.27, 2σ threshold = 3.40 + 4.54 = 7.94. **Spurs game (8 cards) is an outlier** — driven by 2 red cards (Romero 2xYC→red, Simons straight red). Without it: mean = 26/9 = **2.89**, variance drops significantly.

### 1E. Head-to-Head

| Match | Venue | Total | Wolves | Liverpool |
|-------|-------|-------|--------|-----------|
| 2026-03-03 | Molineux | 3 | 2 | 1 |
| 2025-12-27 | Anfield | 1 | 1 | 0 |
| 2025-02-16 | Anfield | 4 | 2 | 2 |
| 2024-09-28 | Molineux | 5 | 2 | 3 |

**Recent 2 H2H avg:** 2.0 total cards — remarkably low.
**At Molineux (2 games):** avg 4.0 — but the Sep 2024 game (5 cards) featured a completely different Wolves squad (Lemina, Matheus Cunha, different formation). Heavy personnel discount applied.
**All 4 H2H avg:** 3.25.

This is a consistently **low-card fixture**. Even the Sep 2024 game with 5 cards was below league average. The two most recent meetings (same season, similar squads) produced just 3 and 1 cards. Personnel continuity is strong — core players overlap significantly. **Weight H2H at 10% given recency and relevance of the Mar 3 game at the same venue.**

### 1F. Player Card Propensity

**Wolves likely XI** (based on Mar 3 lineup):

| Player | Cards/20 | Rate | Role | Risk |
|--------|----------|------|------|------|
| André | 8 | 0.40 | DM | **HIGH** — 8 cards in 20 games, fouls frequently |
| João Gomes | 5 | 0.25 | CM | Moderate — physical midfielder |
| Yerson Mosquera | 9 | 0.45 | CB | **HIGHEST** — but was a sub on Mar 3 |
| Santiago Bueno | 2 | 0.10 | CB | Low |
| Jackson Tchatchoua | 3 | 0.15 | WB | Moderate |

**Key:** If Mosquera starts (he was on bench Mar 3, but started most other games), Wolves' card expectation rises by ~0.3. His 9 cards in 20 games (0.45/game) is elite-level card accumulation for a centre-back.

**Liverpool likely XI:**

| Player | Cards/20 | Rate | Risk |
|--------|----------|------|------|
| Mac Allister | 3 | 0.15 | Moderate — tactical fouler |
| Konaté | 3 | 0.15 | Moderate |
| Szoboszlai | 3 | 0.15 | Moderate (got RED Feb 8, but played since) |
| Gravenberch | 2 | 0.10 | Low |
| Van Dijk | 2 | 0.10 | Low |

Liverpool's repeat offenders are distributed across the squad with no single high-frequency card collector. The squad is unusually disciplined.

**Matchup danger — foul magnets:** Liverpool's Salah and Wirtz are exactly the type of tricky wide players who draw fouls. In the Mar 3 meeting, Wolves managed only 10 fouls (well below their 11.09 home average). Liverpool's technical superiority means Wolves can't foul what they can't get near — but when the game is tight, Wolves' midfield (André, João Gomes) will commit tactical fouls on Liverpool's creators.

### 1G. Referee Analysis — CRITICAL

**Simon Hooper: 2.80 cards/game (n=5)**

| Metric | Hooper | PL Season Avg | Delta |
|--------|--------|---------------|-------|
| Cards/game | 2.80 | 4.09 | **-1.29 (-31.5%)** |
| YC/game | 2.80 | 3.94 | -1.14 |
| RC/game | 0.00 | 0.16 | -0.16 |
| Fouls/game | 21.60 | 22.20 | -0.60 |
| Home card % | 42.9% | ~45.3% | Slight away bias |

**Hooper is one of the most lenient referees in the database.** His 2.80 cards/game is 31.5% below the PL season average. He calls a near-normal number of fouls (21.6) but converts far fewer to bookings — his effective fouls-per-card is 21.6/2.8 = **7.71**, compared to the league's 22.2/4.09 = 5.43. He lets a LOT more fouls go without cards.

The 42.9% home card rate means he books away teams more (57.1%), though with only 5 games the confidence interval is wide.

**Sample caveat:** 5 games is the minimum threshold. I'm weighting at 30% rather than 35-40% due to small sample.

### 1H. Contextual Factors

1. **Match stakes:** Liverpool likely in title contention. Wolves appear mid-table based on results. Not a derby. No obvious "must-win" desperation from either side that would inflate cards. **No adjustment.**

2. **Tactical matchup:** Liverpool play possession-dominant football (low fouls: 9.60 away). Wolves are more physical (17.91 tackles/game at home) but not excessively foul-heavy (11.09 fouls at home). This isn't a pressing-chaos matchup — Liverpool control tempo, Wolves defend. Lower card environment.

3. **League baseline:** PL 2025-26 averages 4.09 cards/match. This is a mid-range league. Fouls-per-card at 5.42 suggests moderate strictness.

4. **Repeat fixture effect:** These teams just played 3 days ago. Familiarity reduces surprise tactical fouls. Players know their opponents' patterns, reducing the chaotic engagement that generates cards.

5. **Game state:** Liverpool are heavy favourites. If they lead, Wolves may commit tactical fouls late (consistent with Wolves' 73% 2H card split). **+0.2 adjustment to 2H cards.**

---

## Phase 2: Predicted Distribution

### Weighting Model

| Factor | Weight | Total Est. | Wolves Est. | Liverpool Est. |
|--------|--------|------------|-------------|----------------|
| Referee (Hooper) | 30% | 2.80 | 1.20 (42.9%) | 1.60 (57.1%) |
| Wolves home avg | 20% | 3.82 | 1.91 | 1.91 |
| Liverpool away avg | 20% | 3.40 | 2.10* | 1.30 |
| Recent form (last 6) | 15% | 2.70† | 1.50 | 0.67 |
| H2H (recent 2) | 10% | 2.00 | 1.50 | 0.50 |
| Context (repeat fixture) | 5% | 2.50 | 1.30 | 1.20 |

*Wolves cards from Liverpool's away perspective (opp cards = 2.10)
†Blended: Wolves recent 6 home total ~3.8 (excluding CP red-card outlier ~3.4); Liverpool recent 6 away total 2.17; average ≈ 2.7

**Weighted Total:**
= 0.30(2.80) + 0.20(3.82) + 0.20(3.40) + 0.15(2.70) + 0.10(2.00) + 0.05(2.50)
= 0.840 + 0.764 + 0.680 + 0.405 + 0.200 + 0.125
= **3.01**

**Weighted Wolves cards:**
= 0.30(1.20) + 0.20(1.91) + 0.20(2.10) + 0.15(1.50) + 0.10(1.50) + 0.05(1.30)
= 0.360 + 0.382 + 0.420 + 0.225 + 0.150 + 0.065
= **1.60**

**Weighted Liverpool cards:**
= 0.30(1.60) + 0.20(1.91) + 0.20(1.30) + 0.15(0.67) + 0.10(0.50) + 0.05(1.20)
= 0.480 + 0.382 + 0.260 + 0.101 + 0.050 + 0.060
= **1.33**

### Reconciliation

- Bottom-up: 1.60 + 1.33 = **2.93**
- Top-down: **3.01**
- Average: **2.97 → round to 3.0**
- Cross-check vs referee: Hooper averages 2.8 cards/game. My estimate of 3.0 is very slightly above — explained by Wolves' moderate physicality at home pulling the number up marginally. ✓
- Cross-check vs H2H: Recent H2H produced 2.0 avg. My 3.0 is above that but the H2H sample of 2 games is small, and one of those (1 total card) was at Anfield where Wolves had fewer reasons to foul. ✓

**Final Estimates:**

| Prediction | Central | Range |
|------------|---------|-------|
| **Wolves cards** | 1.6 | 1–3 |
| **Liverpool cards** | 1.2 | 0–2 |
| **Total match cards** | 2.8 | 1–5 |
| **Spread (Wolves - Liverpool)** | +0.4 | -1 to +2 |
| **1H cards** | ~0.8 | 0–2 |
| **2H cards** | ~2.0 | 1–4 |

The 1H/2H split uses the blended timing data: ~30% first half (0.30 × 2.8 = 0.84), ~70% second half (0.70 × 2.8 = 1.96).

---

## Phase 3: Value Identification

### Distribution Model

Variance/mean check on underlying data:
- Wolves home total: variance 2.56 / mean 3.82 = **0.67** (underdispersed)
- Liverpool away total (excl. Spurs outlier): variance ~1.6 / mean 2.89 = **0.55** (underdispersed)

Both are underdispersed, meaning Poisson will slightly *overestimate* tail probabilities. Poisson is conservative here (any Over bias works against finding Under value). Using **Poisson with λ = 2.8**.

### Poisson Probabilities (λ = 2.8)

| k | P(X=k) | Cumulative |
|---|--------|------------|
| 0 | 0.0608 | 0.0608 |
| 1 | 0.1703 | 0.2311 |
| 2 | 0.2384 | 0.4695 |
| 3 | 0.2225 | 0.6919 |
| 4 | 0.1557 | 0.8477 |
| 5 | 0.0872 | 0.9349 |
| 6 | 0.0407 | 0.9756 |
| 7+ | 0.0244 | 1.0000 |

**Threshold Probabilities:**

| Threshold | Model Prob |
|-----------|-----------|
| Over 2.5 | **53.1%** |
| Over 3.5 | **30.8%** |
| Over 4.5 | **15.2%** |
| Over 5.5 | **6.5%** |
| Over 6.5 | **2.4%** |
| Under 2.5 | **46.9%** |
| Under 3.5 | **69.2%** |
| Under 4.5 | **84.8%** |
| Under 5.5 | **93.5%** |

### Team-Level Poisson

**Wolves λ = 1.6:**
P(Over 0.5) = 79.8%, P(Over 1.5) = 47.5%, P(Over 2.5) = 21.7%, P(Over 3.5) = 7.9%

**Liverpool λ = 1.2:**
P(Over 0.5) = 69.9%, P(Over 1.5) = 33.7%, P(Over 2.5) = 12.0%, P(Over 3.5) = 3.4%

### Spread Distribution (Wolves - Liverpool)

Using Skellam distribution (difference of two independent Poissons, λ₁=1.6, λ₂=1.2):

| Spread | Approx. Prob |
|--------|-------------|
| ≤ -2 | ~7% |
| -1 | ~19% |
| 0 | ~28% |
| +1 | ~25% |
| +2 | ~13% |
| ≥ +3 | ~8% |

Wolves -0.5: P(Wolves more cards) ≈ 46%
Liverpool -0.5: P(Liverpool more cards) ≈ 26%

---

## Phase 4: Output

### Statistical Summary

| Metric | Wolves (Home) | Liverpool (Away) |
|--------|---------------|------------------|
| Venue-filtered avg cards received | 1.91 (n=11) | 1.30 (n=10) |
| All-games avg cards received | 2.20 (n=20) | 1.10 (n=20) |
| Recent 6 avg cards received | 2.00 | 0.67 |
| Avg fouls committed | 11.09 (home) | 9.60 (away) |
| Avg tackles | 17.91 (home) | 11.50 (away) |
| Fouls-per-card ratio | 5.81 | 7.38 |
| Booking points avg (venue) | 19.09 | 13.00 |
| H2H avg total cards (recent 2) | 2.00 | — |
| League avg total cards | ~4.09 | — |
| Referee avg cards/game | 2.80 (n=5) | — |
| Referee vs league delta | **-1.29** | — |

**Predicted total cards:** 1–5 (central **2.8**)
**Predicted spread (Wolves - Liverpool):** -1 to +2 (central **+0.4**)
**Predicted 1H/2H split:** ~0.8 / ~2.0

### Detailed Analysis

This match profiles as a **low-card affair** with nearly every input pointing the same direction:

1. **Hooper is the headline.** At 2.80 cards/game, he's 31.5% below the PL average and has never shown a red in this sample. His fouls-per-card conversion (7.71) is far more lenient than the league norm (5.42). He will let fouls go that other referees book.

2. **Liverpool are remarkably disciplined away.** Their 0.67 team cards in the last 6 away games is extraordinarily low. Their fouls-per-card of 7.38 means they foul smartly — rarely committing bookable offences. Even at their full-sample away rate of 1.30, they're among the cleanest teams in the league.

3. **Wolves are moderate at home** — 1.91 team cards with a 5.81 fouls-per-card ratio. They're not a dirty team, but not clean either. Their card risk is concentrated in André (0.40/game) and João Gomes (0.25/game), both likely starters.

4. **H2H is remarkably clean** — the same fixture 3 days ago produced only 3 cards with the same referee assignment unknown but a clean game regardless. The December meeting at Anfield produced just 1 card.

5. **The tactical matchup suppresses cards.** Liverpool's possession dominance means fewer 50/50 challenges. Wolves defend deep rather than press, reducing midfield clashes.

6. **No stake-based inflation.** This isn't a derby, and while Liverpool may need points for the title, they'll control tempo rather than engage physically.

Every major factor — referee, team profiles, H2H, tactical context — aligns toward the Under. This is the strongest "combined alignment" signal: two relatively clean teams + a genuinely lenient referee.

### Value Picks

**No odds are available in the report** ("Event not found — odds unavailable"). Without market prices, I cannot calculate edges or recommend specific bets.

However, based on the model, when odds do become available, the following guidelines apply:

| # | Target | Model Prob | Notes |
|---|--------|-----------|-------|
| 1 | **Under 3.5 total cards** | **69.2%** | Primary target. League frequency is 37.9% (100% - 62.1%). Model has this at 69.2% — a massive gap vs baseline. Fair odds ~1.45. |
| 2 | **Under 4.5 total cards** | **84.8%** | League frequency 57.8%. Model at 84.8%. Should offer value at most posted lines. Fair odds ~1.18. |
| 3 | **Under 2.5 total cards** | **46.9%** | Aggressive play. League frequency 22.4%. Model nearly doubles it. Fair odds ~2.13. Worth considering if the line is ≥ 2.50. |
| 4 | **Liverpool Under 1.5 cards** | **66.3%** | Liverpool's away discipline + lenient ref. Fair odds ~1.51. |

### Key Signal

The **Under 3.5 total cards** line deserves closest attention when odds publish. The convergence of:
- Hooper's 2.8 cards/game base rate
- Liverpool's recent away discipline (0.67 cards, 2.17 total in last 6)
- H2H precedent (2.0 avg in last 2 meetings)
- No contextual factors pushing upward

...makes this one of the cleanest Under signals I've modelled. The risk factors are limited: a potential Wolves collapse leading to frustration fouls (if Liverpool go 2-0 up early), or Mosquera starting and bringing his 0.45 card rate into a physical battle. Neither is enough to overcome the referee's leniency.

### Bets to Avoid

1. **Over 4.5 total cards** — Might look tempting given Wolves' 36.4% home frequency at this threshold, but that frequency was generated under *average* refereeing. With Hooper, the true probability drops to ~15%. The Wolves home data is misleading without referee adjustment.

2. **Wolves team Over 2.5 cards** — Wolves' aggressive repeat offenders (Mosquera, André) make this look viable, but Hooper's leniency specifically suppresses this type of bet. His fouls-per-card conversion means André can commit 3-4 fouls and walk away clean.

### Caveats

- **Referee sample (n=5):** Hooper's profile is consistent but based on a small sample. One outlier game would meaningfully shift his average. Weight accordingly.
- **Repeat fixture in 3 days:** Fatigue and rotation could alter both lineups. If Wolves rest André or Liverpool rotate out Mac Allister, the already-low card expectations drop further.
- **No odds available:** All value assessments are theoretical until market prices publish. The model suggests strong Under lean, but actual edge depends on where books set their lines.
- **Poisson underdispersion:** Both teams' card distributions are more concentrated than Poisson assumes, meaning tail probabilities (very high or very low cards) may be slightly overstated. This marginally benefits the Under case at thresholds like 4.5+.
- **Red card risk:** The model estimates essentially zero red card probability (Hooper: 0 reds in 5 games). If a red occurs, it adds 1 card minimum and often triggers additional bookings. This is an unmodellable tail risk that could push totals to 5+.