# Tottenham Hotspur vs Crystal Palace — Card Market Analysis

## Phase 1: Statistical Analysis

### 1A. Data Cleaning

**Tottenham:** All 20 games have valid card data. **Flag:** Games 6 (Frankfurt CL), 8 (Dortmund CL), 10 (Villa FA Cup), 17 (Slavia CL) are non-PL. 16 PL games remain.

**Crystal Palace:** Games 19 (Fulham away) and 20 (Burnley away) have **no card data** — no YC line, no individual cards listed. The low fouls (8–5, 8–9) make 0-0 cards *plausible* but not confirmed. The pre-computed stats (n=11 away) include these as 0-card games, which inflates the denominator and deflates the mean. I flag this and present both "with" and "without" figures. **Flag:** Games 2, 4, 16, 18 are Conference League; game 10 is FA Cup. 13 PL games remain (11 valid for cards).

### 1B. Tottenham (Home) Card Profile

**Venue-filtered (Home, all comps, n=11):**
- Team cards received: mean 2.91, median 3, range 1–5, variance 1.36 (underdispersed vs mean)
- Opponent cards: mean 2.64, median 3, range 1–4
- Total match cards: mean 5.55, median 5, range 3–8, variance 2.87

**PL-only home (n=8):** Games 2, 3, 5, 9, 12, 15, 18, 20
- Total cards: 3, 5, 6, 8, 5, 8, 7, 5 → mean **5.88**, median 5.5
- Team cards: 2, 3, 3, 5, 2, 5, 3, 3 → mean **3.25**
- Opp cards: 1, 2, 3, 3, 3, 3, 4, 2 → mean **2.63**

**All-games (n=20):** mean 4.75 total, 2.65 team, 2.10 opp.

**Venue delta:** PL home total (5.88) vs all-games (4.75) = **+1.13 cards at home**. Spurs are significantly more card-prone at home — and so are their opponents.

**Trend (recent 6 vs older 14):**
- Recent 6 team cards: 3, 2, 3, 3, 3, 2 → **2.67/game**
- Older 14 team cards: **2.64/game**
- Recent 6 total match cards: 6, 3, 5, 4, 6, 2 → **4.33/game**
- Older 14 total: **4.93/game**

Recent total is lower, but this includes a CL game (Frankfurt, 2 cards) and an away game at Man Utd reduced to 10 men. The 4 PL games in the recent 6 averaged **4.75**, essentially flat with the baseline. No strong trend signal.

**Fouls-per-card:** 3.81 (home). This is **well below** the league average of 5.42 — Spurs are carded very efficiently. They don't need to commit many fouls to pick up bookings. With a strict referee, this ratio shouldn't compress much further; they're already "efficiently carded."

**Card timing:** 32% first half, 68% second half. Heavy 2H skew with a pronounced 76–FT cluster (31% of all cards). This matches their profile of conceding goals and chasing games — late tactical fouls and frustration.

**Booking points:** Home avg 31.82 team, 59.55 total. The Liverpool game (2 reds, ~75 booking pts for Spurs alone) inflates this. Without Liverpool: team avg ~27.0.

**Tackles & interceptions:** 16.0 tackles/game at home (moderate), 8.36 interceptions. Not an extremely aggressive tackling side, but fouls are relatively high for their tackle count → indicative of cynical/tactical fouling rather than rash challenges.

### 1C. Crystal Palace (Away) Card Profile

**Venue-filtered (Away, all comps, n=11):**
- Team cards: mean 1.91, median 3, range 0–3, variance 1.72
- Opp cards: mean 1.45, range 0–3
- Total match cards: mean 3.36, variance 3.50 (overdispersed — driven by the two 0-card games)

**PL-only away (excluding missing-data games, n=6):** Games 1, 6, 7, 9, 12, 15
- Team cards: 3, 3, 3, 3, 3, 3 → mean **3.00** — remarkably consistent
- Total: 5, 4, 5, 6, 4, 4 → mean **4.67**

**Including the 0-card games (n=8):** Team 2.25, total 3.50. The 0-card games from early December are 3 months old; the 6 valid PL away games since all show exactly 3 CP cards. I weight the valid-data sample more heavily.

**All-games (n=18 valid):** mean 3.80 total, 2.20 team cards.

**Venue delta:** PL away total (4.67 valid) vs all-games (3.80) = +0.87 away in PL. Conference League games (lower intensity) deflate the overall numbers.

**Trend (recent 6 vs older 12):**
- Recent 6 team cards: 3, 3, 5, 1, 2, 3 → **2.83/game** (up from 2.25 in older games)
- Recent 6 total: 5, 6, 7, 3, 3, 4 → **4.67/game** (up from 3.33)

Upward trend in card accumulation. The Wolves game (5 CP cards) is a recent outlier, but even excluding it, recent 5 average 2.4 team and 4.2 total.

**Fouls-per-card:** 5.33 (away). Well above league average of 5.42 — actually close to average. But compared to Spurs' 3.81, CP are "getting away with it" more. Under a strict ref (Gillett), this ratio may compress, producing more cards per foul.

**Card timing:** 37% first half, 63% second half. Notably, 29% of CP team cards come in the 31–HT window — a high concentration. This suggests cards from tactical fouls to prevent counters as halftime approaches.

**Booking points:** Away avg 20.45 team, 36.36 total. No red-card distortion from away team reds (Chelsea red was a 2nd yellow → only 1 actual red in 11 away games).

**Tackles & interceptions:** 16.36 tackles/game away (moderate). CP play a compact 3-4-2-1 that relies more on shape than aggressive pressing.

### 1D. Outlier Check

**Spurs home (σ = 1.69):** 2σ threshold = 5.55 + 3.38 = 8.93. No games exceed this. However, the **Liverpool game** (8 cards, 2 reds, result of complete meltdown after Simons red card) is borderline and qualitatively an outlier. The **West Ham game** (8 cards) was legitimate ill-temper (5 Spurs yellows).

Without Liverpool: Spurs home total mean = **5.30** (n=10)
Without both 8-card games: **5.00** (n=9)

**CP away:** The two 0-card games (if real) are 1.8σ below mean. Not statistical outliers, but they dominate the average. Excluding them: mean rises from 3.36 to **4.11** (n=9).

### 1E. Head-to-Head

| Date | Venue | Total Cards | Fouls | Notes |
|------|-------|-------------|-------|-------|
| Dec 2025 | CP home | 5 (2+3) | 12 | Low-intensity, tight game |
| May 2025 | Spurs home | 2 (1+1) | N/A | >9 months old, heavy discount |
| Oct 2024 | CP home | 8 (4+4) | 28 | >16 months old, discard |

The only relevant H2H is December 2025 (5 cards). The May 2025 game at this venue returned just 2 cards, but under a different manager/squad configuration (Kulusevski, Son, Kinsky starting; no Palhinha, no Simons). **Significant personnel turnover since May → minimal weight.**

H2H weighted estimate: ~4.0 (discounted blend of 5 and 2, heavier weight on the Dec game which was away).

### 1F. Player Card Propensity

**Spurs likely XI (based on recent selections):**
| Player | Cards/20 | Rate | Position | Notes |
|--------|----------|------|----------|-------|
| Archie Gray | 7 | 0.35 | CM/RB | Highest card rate in squad |
| João Palhinha | 6 | 0.30 | DM | Classic DM card magnet |
| Micky van de Ven | 6 | 0.30 | CB | Aggressive recovery tackles |
| Pedro Porro | 5 | 0.25 | RWB/RB | Started most recent game |
| Xavi Simons | 3 (+1R) | 0.20 | AM | Includes straight red vs Liverpool |
| Yves Bissouma | 2 | 0.10 | CM | Rotation risk |
| Radu Dragusin | 0 | 0.00 | CB | Romero's replacement |

**Key absence: Cristian Romero** (6 cards / 0.30 per game). Not in last 3 starting XIs, replaced by Dragusin (0 cards in 20 games). Estimated reduction: **−0.25 to −0.30 cards/game**. This is already reflected in the most recent games (Dragusin started 3 of last 5).

**Crystal Palace likely XI:**
| Player | Cards/20 | Rate | Position | Notes |
|--------|----------|------|----------|-------|
| Adam Wharton | 6 | 0.30 | CM | Most-booked Palace player |
| Jaydee Canvot | 3 | 0.15 | CB | Aggressive challenges |
| Will Hughes | 3 | 0.15 | CM | Started most recent PL game |
| Daniel Muñoz | 2 | 0.10 | RWB | Aggressive wingback |
| Chris Richards | 3 | 0.15 | CB | |
| Tyrick Mitchell | 3 | 0.15 | LWB | |
| Jørgen Strand Larsen | 3 | 0.15 | ST | Competes aerially |

**Key absence: Maxence Lacroix** — sent off (straight red, 56') vs Man Utd on March 1. A straight red card in the PL carries a minimum 1-match ban. He is almost certainly **suspended** for this fixture. Lacroix: 3Y + 1R in 20 games (0.20/game including reds). Estimated reduction: **−0.15 to −0.20 cards/game**. Likely replaced by Chadi Riad (2 cards in limited appearances) — partial offset.

**Matchup danger:** Ismaïla Sarr and Yéremy Pino are tricky wide players who draw fouls. Spurs' aggressive fullbacks (Porro 5 cards, Spence 2 cards when playing) will be exposed. CP's team card timing shows 29% in the 31–HT slot — these are often tactical fouls to prevent Spurs' counterattacking.

Conversely, Xavi Simons' movement between the lines should draw fouls from CP's midfield (Wharton 6 cards, Hughes 3 cards).

### 1G. Referee Analysis — CRITICAL

**Jarred Gillett:**
- **Cards/game: 4.80** (n=5) — all yellows, 0 reds
- **Fouls/game: 21.0**
- **Home cards %: 58.3%** — books the home team significantly more than average
- **+1.04 above league multi-season avg (3.76)** = **27.7% stricter than average**
- **+0.71 above this season's avg (4.09)** = **17.4% stricter than current season**

Gillett is a demonstrably **strict referee**. His fouls-per-card ratio: 21.0 / 4.8 = **4.375** — tighter than the league average of 5.42. He converts fouls into cards at a higher rate.

**Home-card bias (58.3%)** is unusual and noteworthy. Most refs book away teams more (league average: home 1.85 vs away 2.24 = 45% home). Gillett bucks this trend significantly. Applied to his 4.8 cards/game:
- Expected home (Spurs) cards from ref profile: 4.8 × 0.583 = **2.80**
- Expected away (CP) cards from ref profile: 4.8 × 0.417 = **2.00**

**Sample size caveat:** 5 games is the minimum acceptable. Confident in the direction (strict) but the precise magnitude could shift with more data.

**Weighting:** With 5 games and a clear directional signal confirmed by the +1.04 delta, I weight the referee profile at **~33%**.

### 1H. Contextual Factors

1. **Match stakes:** Mid-table PL fixture. No derby, no relegation battle. Spurs are underperforming (4 losses in last 6 PL, no wins) — frustration factor could add ~0.2 cards. Adjustment: **+0.2**.

2. **Tactical matchup:** CP's compact 3-4-2-1 against Spurs' more open system. CP will sit deep and counter. Spurs will have possession (~58-62%) and commit bodies forward, leaving them vulnerable to counters that they'll foul to stop. This dynamic typically produces fouls from *both* sides — Spurs fouling to recover, CP fouling to break up play.

3. **League baseline:** PL 2025-26 season average = 4.09 cards/match. This is the floor expectation.

4. **Game state:** If Spurs go behind (plausible given recent form — lost 4 of last 6), expect a late-game card cluster. Spurs' 76–FT card concentration (31% of all cards) supports this.

---

## Phase 2: Predicted Distribution

### Component Estimates

**Total cards:**

| Factor | Weight | Estimate | Contribution |
|--------|--------|----------|--------------|
| Referee (Gillett) | 33% | 4.80 | 1.584 |
| Venue-filtered (PL-adjusted)* | 27% | 5.27 | 1.423 |
| Recent form (last 6) | 18% | 4.50 | 0.810 |
| H2H | 7% | 4.00 | 0.280 |
| Context (league avg + stakes) | 15% | 4.30 | 0.645 |
| **Weighted total** | | | **4.74** |

*Venue-filtered PL: midpoint of Spurs PL home (5.88) and CP PL away valid (4.67) = 5.27

Absentee adjustments: Romero out (−0.25, already in recent data — partial credit, net −0.10). Lacroix out (−0.15). Riad replacement partially offsets (+0.05). **Net adjustment: −0.20**.

Frustration/stakes: **+0.20**.

**Final total λ = 4.74 − 0.20 + 0.20 = 4.74 → round to 4.75**

**Team-level breakdown:**

| Factor | Spurs cards | CP cards |
|--------|-------------|----------|
| Referee split (58.3%/41.7%) | 2.80 | 2.00 |
| Venue avg (PL home/away) | 3.25 | 3.00 |
| Recent 6 (all games) | 2.67 | 2.83 |
| Blend (~35/30/20/15) | **2.85** | **2.40** |

Adjustment: Lacroix absence from CP: −0.12 → CP **2.28**.
Spurs post-Romero: already reflected → **2.85**.

Cross-check: 2.85 + 2.28 = 5.13. Slightly above my 4.75 total. The discrepancy arises because the total model is anchored more heavily to the referee's 4.8 figure while the individual team models lean on PL venue data. I'll reconcile by scaling down proportionally: Spurs **2.65**, CP **2.10**, total **4.75**.

Actually — let me reconsider. The venue data is very strong (PL home Spurs = 5.88 total over 8 games). The referee at 4.8 is already above average and aligns with the higher-card venue data. Let me push total slightly higher to **4.85** as a compromise.

**Final estimates:**
- **Spurs cards: 2.70** (range 1–5)
- **CP cards: 2.15** (range 0–4)
- **Total cards: 4.85** (range 3–8)
- **Spread (Spurs − CP): +0.55** (range −2 to +3)

### 1H/2H Split

Combined timing: ~34% first half, ~66% second half.
4.85 × 0.34 = **~1.65 first half**
4.85 × 0.66 = **~3.20 second half**

### Reconciliation

- Spurs (2.70) + CP (2.15) = 4.85 ✓
- Referee avg (4.8) vs my total (4.85): aligned ✓
- Spurs home PL avg (5.88) vs total (4.85): my estimate is below, but the CP away data (3.36–4.67 depending on treatment of 0-card games) pulls it down. The blend is reasonable.
- League avg (4.09) vs my total (4.85): I'm ~19% above league average, justified by Gillett (+17% above season avg) and Spurs' hot home card environment.

---

## Phase 3: Value Identification

### Distribution Model

Total cards λ = 4.85. Variance check:
- Spurs home variance: 2.87 (mean 5.55) — variance < mean → slightly underdispersed
- CP away variance: 3.50 (mean 3.36) — variance ≈ mean

Using **Poisson** for total cards (variance ≈ mean for combined total; sum of two independent Poissons is Poisson).

### Poisson Probabilities (λ = 4.85)

| k | P(X=k) | P(X≤k) |
|---|--------|--------|
| 0 | 0.0079 | 0.0079 |
| 1 | 0.0383 | 0.0462 |
| 2 | 0.0928 | 0.1390 |
| 3 | 0.1500 | 0.2890 |
| 4 | 0.1819 | 0.4709 |
| 5 | 0.1764 | 0.6473 |
| 6 | 0.1426 | 0.7899 |
| 7 | 0.0988 | 0.8887 |

**P(Over 4.5) = 1 − P(X≤4) = 1 − 0.4709 = 0.5291**

### Totals Market

| Line | Side | Odds | Implied Prob (raw) | Implied (vig-adj) | Model Prob | Edge (vs raw) |
|------|------|------|--------------------|--------------------|------------|---------------|
| 4.5 | Over | 2.05 | 48.78% | 45.2% | **52.9%** | +8.5% |
| 4.5 | Under | 1.69 | 59.17% | 54.8% | 47.1% | −20.4% |

Edge calculation for Over 4.5: Model Prob × Odds − 1 = 0.529 × 2.05 − 1 = **+8.5% expected value**.

### Sensitivity Analysis

| λ | P(Over 4.5) | Edge on O4.5@2.05 |
|---|-------------|-------------------|
| 4.5 | 46.8% | −4.1% (no value) |
| 4.75 | 51.1% | +4.8% (marginal) |
| 4.85 | 52.9% | +8.5% ✓ |
| 5.0 | 55.9% | +14.7% ✓ |
| 5.25 | 60.5% | +24.1% ✓ |

The Over 4.5 remains positive EV for any λ ≥ 4.78. My estimate would need to be below 4.75 for the value to disappear entirely. Given:
- Gillett at 4.8 cards/game alone
- Spurs PL home at 5.88 total
- CP PL away (valid) at 4.67

...a λ below 4.75 requires actively dismissing multiple strong data points. I'm confident the true λ is in the **4.75–5.10 range**.

### Spread Market

| Outcome | Line | Odds | Implied (raw) |
|---------|------|------|---------------|
| Crystal Palace | −0.25 | 1.87 | 53.5% |
| Tottenham | +0.25 | 1.83 | 54.6% |

My spread estimate: Spurs +0.55 (Spurs get *more* cards). The market prices CP to receive more cards (CP −0.25 favored at slightly better odds).

For Spurs +0.25: Spurs wins if Spurs cards ≥ CP cards (the +0.25 means a tie goes Spurs' way). Using Skellam distribution approximation with Spurs λ=2.70, CP λ=2.15:
- Mean(Spurs − CP) = +0.55
- Var = 2.70 + 2.15 = 4.85, SD = 2.20
- P(Spurs ≥ CP) = P(diff ≥ 0) ≈ Φ(0.55/2.20) = Φ(0.25) ≈ **59.9%**

Edge on Spurs +0.25 @ 1.83: 0.599 × 1.83 − 1 = **+9.6%**

This is driven by Gillett's home-card bias (58.3%) which directly contradicts the market's expectation that CP receives more. The market may be anchoring on CP's higher away card rate (3.00/game PL valid) vs Spurs' 3.25 home rate — but ignoring the referee overlay.

### Cross-Checks

1. **Referee consistency:** My total (4.85) aligns tightly with Gillett's 4.80. ✓
2. **Fouls-per-card:** Spurs' 3.81 ratio under a strict ref (4.375 ratio) = ref is slightly more lenient than Spurs' baseline. CP's 5.33 ratio under Gillett's 4.375 = significant compression → CP should receive *more* cards than their baseline suggests. This supports the Over. ✓
3. **Combined alignment:** Spurs home (high-card environment) + strict referee → both point Over. CP's PL away data (3.00 team cards consistently) also supports total cards. No trap signal — all factors align.
4. **Bookmaker line:** Only one book (DraftKings), so no cross-book disagreement to flag.

---

## Phase 4: Output

### Statistical Summary

| Metric | Tottenham (Home) | Crystal Palace (Away) |
|--------|-------------------|----------------------|
| Venue-filtered avg cards received | 2.91 (n=11) / **3.25 PL (n=8)** | 1.91 (n=11) / **3.00 PL valid (n=6)** |
| All-games avg cards received | 2.65 (n=20) | 2.20 (n=18 valid) |
| Recent 6 avg cards received | 2.67 | 2.83 |
| Avg fouls committed (venue) | 11.09 | 10.18 |
| Avg tackles (venue) | 16.00 | 16.36 |
| Fouls-per-card ratio | 3.81 (efficient) | 5.33 (lenient) |
| Booking points avg (venue) | 31.82 team / 59.55 total | 20.45 team / 36.36 total |
| H2H avg total cards | ~4.0 (weighted) | — |
| League avg total cards | 4.09 (season) | — |
| Referee avg cards/game | **4.80** (n=5) | — |
| Referee vs league delta | **+1.04 (+27.7%)** | — |

**Predicted total cards:** 3–7 (central **4.85**)
**Predicted spread:** Spurs −0.55 more cards than CP (range −2 to +3)
**Predicted 1H/2H split:** ~1.6 / ~3.2 cards

---

### Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | **Over Total Cards** | 4.5 | 2.05 | 52.9% | 48.8% | **+8.5%** | ★★★★ Medium-High |
| 2 | **Tottenham card spread** | +0.25 | 1.83 | 59.9% | 54.6% | **+9.6%** | ★★★ Medium |

### Pick 1: Over 4.5 Total Cards @ 2.05

The primary driver is the convergence of a strict referee with a high-card home environment. Gillett averages 4.8 cards/game — already above the line — and Spurs' PL home games average 5.88 total cards across 8 matches. Crystal Palace's valid PL away games all feature exactly 3 team cards (6 consecutive games), contributing a reliable floor. The fouls-per-card compression is key: CP's lenient 5.33 ratio should tighten under Gillett's 4.375 ratio, generating an additional ~0.3–0.5 CP cards above their baseline. The value survives sensitivity testing — it remains positive for any λ ≥ 4.78. **Risk factors:** Gillett's sample is only 5 games; if CP sit extremely deep and limit confrontations (as in the 2-card May H2H), the under is achievable; Lacroix's suspension may paradoxically *reduce* cards if his aggressive replacement (Riad) is more conservative.

### Pick 2: Tottenham Hotspur +0.25 Cards Spread @ 1.83

The market implies Crystal Palace will receive more cards, which contradicts both the referee data and Spurs' home profile. Gillett's 58.3% home-card bias is the decisive factor — he books the home team disproportionately, which is unusual. Spurs also field four players with ≥5 cards in 20 games (Gray 7, Palhinha 6, van de Ven 6, Porro 5), all near-certain starters. Meanwhile, CP lose their most-carded defender (Lacroix, suspended) and their away fouls-per-card ratio (5.33) suggests they avoid cards despite committing fouls. The model estimates Spurs at 2.70 vs CP at 2.15 — a +0.55 gap that comfortably covers the +0.25 line. **Risk factors:** CP's recent PL away record of exactly 3 cards per game is stubbornly consistent; if Gillett's home bias regresses in this specific match (small sample), the spread tightens; Spurs managing a lead (unlikely but possible) would reduce their frustration-driven late cards.

### Bets to Avoid

1. **Under 4.5 Cards @ 1.69** — The shorter price might tempt, especially given the quiet May H2H (2 cards) and CP's low away total (3.36 overall). But the 3.36 figure is artificially deflated by two probable zero-card games from December; PL-valid data shows 4.67 total. A strict referee + Spurs' home environment makes the Under a losing proposition at this price.

2. **Crystal Palace −0.25 Spread @ 1.87** — CP's consistent 3.00 away card average in PL games looks like it should beat Spurs' 3.25 home average. But this ignores the referee overlay: Gillett's 58.3% home-card rate is the single strongest predictor for the spread, and it points firmly toward Spurs receiving more cards. The market appears to be overweighting raw team card averages without adjusting for this referee's specific bias.

### Caveats

- **Referee sample size (n=5):** Gillett's card rate and home bias are directionally reliable but could shift with more data. A ±0.5 cards/game confidence interval is realistic.
- **CP missing card data:** Two away games with no card records inflate uncertainty in CP's away baseline. I've presented both "with" and "without" figures throughout.
- **Lacroix suspension:** Assumed but not confirmed from match news. If he plays, add ~+0.15 to CP's card estimate (marginal impact on total, strengthens Over slightly).
- **Red card distortion:** Spurs' Liverpool game (2 reds, 8 total cards) inflates home averages. Without it, home total drops from 5.55 to 5.30 — still well above the line.
- **Poisson assumption:** Card counts can cluster (one incident triggers multiple cards). The Poisson model underestimates the probability of extreme tails (0–1 cards or 8+ cards). This is a known limitation but doesn't meaningfully affect the 4.5-line analysis.