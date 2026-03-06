Now I have sufficient contextual data to work with. Let me compile the analysis.

---

# Athletic Bilbao vs Barcelona — Corner Market Analysis

**Date:** 2026-03-07 | **Venue:** San Mamés, Bilbao

---

## CRITICAL DATA LIMITATIONS — READ FIRST

This analysis faces three fatal constraints:

1. **Athletic Bilbao match-level data: ZERO games** — the report returned no individual match records for Athletic. There is no lineup data, no formation data, no game-by-game corner splits, and no substitution patterns.
2. **Head-to-head data: NONE** — no H2H matches returned.
3. **Corner odds: NONE** — the event was not found in the odds feed.

Without odds, **no value identification is possible**. Without Athletic's match-level data, the analytical framework is compromised at its foundation. What follows is a partial analysis synthesising Barcelona's 20-game report with web-sourced aggregate statistics for Athletic Bilbao. This is informational only — **no picks can be made**.

---

## Phase 1 — Statistical Analysis (Partial)

### 1A. Data Cleaning — Barcelona

All 20 Barcelona games have valid corner data. No missing values.

**Competition breakdown:**
- La Liga: 16 games (same-league, fully comparable)
- Champions League: 4 games (Copenhagen H, Slavia Prague A, Eintracht Frankfurt H, Club Brugge A, Chelsea A) — different competitive context; European opponents are not La Liga-comparable

For Athletic-specific projections, I will lean on the 16 La Liga games, noting the UCL games separately.

### 1B. Barcelona Corner Stats (All Games, n=20)

**Corners won:** 3, 13, 7, 12, 8, 10, 10, 4, 8, 7, 10, 14, 5, 7, 5, 5, 5, 0, 5, 4
- Mean: 7.10
- Median: 7.0
- Range: 0–14
- Variance: 12.09
- SD: 3.48

**Corners conceded:** 2, 7, 3, 3, 2, 1, 1, 5, 6, 5, 5, 1, 0, 7, 4, 4, 4, 7, 2, 0
- Mean: 3.45
- Median: 3.5

**Match totals:** 5, 20, 10, 15, 10, 11, 11, 9, 14, 12, 15, 15, 5, 14, 9, 9, 4, 12, 7, 4
- Mean: 10.55
- Median: 10.5
- Variance: 16.68
- SD: 4.08

### Barcelona AWAY games (n=9 — relevant as Barça play away here)

Games: Girona (10), Elche (10), Slavia Prague (9), Real Sociedad (14), Espanyol (12), Villarreal-A (15), Real Betis (14), Celta Vigo (7), Club Brugge (4)

**Corners won away:** 7, 8, 4, 8, 7, 10, 7, 5, 4
- Mean: 6.67
- Median: 7.0

**Corners conceded away:** 3, 2, 5, 6, 5, 5, 7, 2, 0
- Mean: 3.89

**Match totals away:** 10, 10, 9, 14, 12, 15, 14, 7, 4
- Mean: 10.56
- Median: 10.0
- Variance: 12.03
- SD: 3.47

### Barcelona HOME games (n=11)

**Match totals home:** 5, 20, 15, 11, 11, 15, 5, 9, 9, 12, 4
- Mean: 10.55
- Median: 11.0

**Venue delta**: Away mean (10.56) ≈ Home mean (10.55) — no meaningful venue split for Barcelona's total corners.

### Barcelona Recent Trend (last 6 games: Villarreal-H, Levante-H, Girona-A, Mallorca-H, Elche-A, Copenhagen-H)

Totals: 5, 20, 10, 15, 10, 11 → Mean: 11.83

Older 14 games → Mean: (total sum 211 − 71) / 14 = 140/14 = 10.00

Recent form runs ~1.8 corners higher than older games. However, the Levante game (20 total corners) is a massive outlier. Removing it: recent 5 games = 5, 10, 15, 10, 11 → Mean: 10.20 — virtually identical to older form. **The recent uptick is fragile, driven almost entirely by the Levante outlier.**

### 1C. Athletic Bilbao — From Web Sources (Aggregate Only)

From soccerstats.com and footiqo.com (full season, 25–26 La Liga):

| Metric | Home (n≈13) | Away (n≈12–13) | Overall (n≈25–26) |
|--------|-------------|-----------------|---------------------|
| Avg corners won | 5.62–5.69 | 5.08–5.17 | 5.36–5.50 |
| Avg corners conceded | 3.77 | 4.00 | 3.88–4.00 |
| Avg total corners | 9.46 | ~9.08–9.17 | 9.24–9.31 |
| Over 8.5% | 77% (H) | 58% (A) | 68–71% |
| Over 9.5% | 46% (H) | 50–58% (A) | 50–54% |
| Over 10.5% | 46% (H) | 33% (A) | 38–42% |

Key observations:
- Athletic at home average ~9.46 total corners — **below the La Liga average** of ~9.64.
- They win ~5.65 corners at home and concede ~3.77. This is a below-average corner-generating profile.
- Only 46% of home games exceed 10.5 total corners — a distinctly low-corner home environment.
- Without Nico Williams (groin injury, confirmed out), their attacking width on the left flank is severely reduced. Williams is their primary dribbler and crosser from wide areas.

### 1D. Outlier Check — Barcelona

Mean total = 10.55, SD = 4.08. Outlier threshold (>2σ): 10.55 + 2(4.08) = 18.71.

**The Levante game (20 total corners) exceeds this threshold.** It was a 3-0 home win with 28 crosses attempted by Barcelona, 13 corners won — an extreme attacking performance against a relegation-bound side.

Barcelona away totals without any outlier games: all 9 away games are within 2σ.

**All-games mean without the Levante outlier (n=19):** (211 − 20)/19 = 191/19 = 10.05

### 1E. Head-to-Head

No H2H match data was returned in the report. From web sources, the most recent meeting was **Barcelona 4-0 Athletic Club on 22 November 2025** (game #18 in Barcelona's data): 5w-7c, 12 total corners. Athletic won 7 corners (via 19 crosses, 6 cross accuracies) despite the heavy defeat — suggesting they crossed frequently even when behind. Barcelona won only 5 in that game despite dominating.

That single data point is from the reverse fixture at Camp Nou, ~3.5 months ago, with a different venue, different lineup availability (Nico Williams status unknown for that game, Koundé and Balde were fit). **Very limited H2H utility.**

Web aggregate for last 5 H2H: Athletic 13 corners total, Barcelona 33 corners total — Barcelona heavily dominant. But personnel continuity is unknown.

### 1F. Key Barcelona Lineup/Absence Factors

**Confirmed OUT for Barcelona:**
- **Jules Koundé** (hamstring, ~4 weeks) — key attacking fullback, overlaps on the right, significant corner contributor. In the report data, when Koundé started (most games), Barcelona averaged higher attacking output.
- **Alejandro Balde** (hamstring, ~4 weeks) — left-back, overlapping runner.
- **Frenkie de Jong** (hamstring)
- **Gavi** (long-term)
- **Andreas Christensen** (no return date)
- **Robert Lewandowski** — reportedly available with a protective mask (fractured eye socket), but fitness uncertain.

**Available fullbacks:** João Cancelo, Gerard Martín. Both have started in the report data. Cancelo and Martín are capable but represent a step down in attacking dynamism from Koundé/Balde.

**Impact estimate from Barcelona's data:**

Koundé started in 17 of 20 games. He's essentially the default — games without him are too few to isolate his impact statistically. However, his overlapping runs on the right and delivery are significant. His absence likely reduces Barcelona's corner-winning capacity by ~0.5–1.0 corners.

Balde started in 14 of 20 games. Gerard Martín deputised in several games without issue. The impact is smaller than Koundé's.

### 1G. Athletic Bilbao Absences

- **Nico Williams** (groin) — their most dangerous wide attacker. His dribbling and crossing from the left generate corners. His absence significantly reduces Athletic's corner-winning ability. Web reports suggest he's been dealing with a recurring groin problem all season.
- **Yeray Álvarez** (suspended) — centre-back, set-piece target.
- **Beñat Prados, Unai Egiluz, Maroan Sannadi** (knee injuries) — squad depth losses.

### 1H. Contextual Factors

**League baseline:** La Liga 2025-26 averages ~9.64 total corners per match.

**Barcelona** (11.77 total corners overall per soccerstats.com, 11.31 at home) are the highest total-corner team in La Liga. Even away (from Barcelona's report data: 10.56), they generate above-league-average totals.

**Athletic Bilbao** (9.31–9.46 at home) are slightly below league average. Their matches tend to be structured and physical, consistent with Valverde's organized 4-2-3-1 which prioritizes defensive solidity.

**Motivation:** Barcelona lead La Liga by 4 points. Athletic are 9th with 35 points — in the European places battle but not in crisis. Barcelona have a Champions League R16 vs Newcastle the following Tuesday, which could lead to some rotation or conservation of energy, potentially reducing intensity/pressing that generates corners.

**Score-state consideration:** Barcelona's lower-corner games (Chelsea 4, Club Brugge 4, Villarreal-H 5, Atlético-H 9, Alavés-H 9) generally coincided with either European away games where they sat deeper, or games against organized defensive sides. Athletic at home should be in this "organized mid-block" category.

---

## Phase 2 — Predicted Distribution

### Barcelona Corners Won (Away)

**Primary input — Barcelona's own away corners won:** mean 6.67, median 7.0 across 9 away games. Recent away games (last 4): Girona 7, Elche 8, Slavia 4, Real Sociedad 8 → mean 6.75. Consistent with the baseline.

**Secondary input — Athletic's home corners conceded:** ~3.77 per game. This is low, but Athletic face weaker attacking sides at home more frequently. Barcelona's attacking quality far exceeds the average La Liga visitor. I discount Athletic's low conceded rate by ~30% — expecting Barcelona to exceed what typical visitors manage.

**Adjustment for Koundé absence:** Barcelona lose their primary attacking fullback. His overlapping runs and crosses from the right are a significant corner source. Estimate −0.5 corners from baseline.

**Estimate:** Central 6.0 (range 4–9). The Koundé absence and San Mamés factor pull it down from the 6.67 away baseline.

### Athletic Bilbao Corners Won (Home)

**Primary input — Athletic's home corners won (web aggregate):** ~5.65 per game across 13 home La Liga matches.

**Adjustment for Nico Williams absence:** Williams is Athletic's primary width-creator on the left. Without him, their crossing and dribble-into-corner output drops. Estimate −0.5 to −1.0 corners.

**Secondary input — Barcelona's away corners conceded:** 3.89 per game. Barcelona are a possession-dominant side; opponents struggle to establish sustained attacks. This corroborates a below-baseline figure for Athletic.

**Counter-factor:** Athletic at San Mamés play with intensity and crowd support. They generated 7 corners against Barcelona in November (at Camp Nou, away), suggesting they cross frequently even when outplayed. At home, this could be sustained.

**Estimate:** Central 4.5 (range 3–7). The Williams absence and Barcelona's possession dominance pull this below Athletic's home baseline of ~5.65.

### Total Match Corners

Per-team sum: 6.0 + 4.5 = **10.5**

Cross-check with Barcelona's away total average (10.56) and Athletic's home total average (9.46): the midpoint is ~10.0, with Barcelona's propensity to be in higher-corner games pulling it up.

The absence of Koundé (Barcelona) and Williams (Athletic) both pull the total down — two of the most corner-generating players in this matchup are missing.

**Central estimate: 10.0** (range 7–14)

This is slightly above the La Liga average of 9.64, reflecting Barcelona's elevated corner propensity partially offset by the absences and Athletic's structured home approach.

### Corner Spread (Athletic − Barcelona)

Central: 4.5 − 6.0 = **−1.5** (Barcelona favoured by 1.5 corners)

Barcelona's away corners-won average (6.67) exceeds Athletic's home average (5.65) even before adjustments. With Williams out for Athletic and only Koundé out for Barcelona (partially offset by Cancelo), the spread should favour Barcelona.

**Estimate: Barcelona −1.5** (range −4 to +2)

### Reconciliation of Contradictions

1. **Athletic's home O10.5 rate (46%) vs Barcelona's away involvement O10.5 rate (~56%):** These disagree on whether the game goes over 10.5. Athletic's structured home approach suppresses corners; Barcelona's attacking style inflates them. Given the absences on both sides, I lean toward Athletic's lower figure — a total slightly below 10.5 is the central expectation.

2. **Athletic's 7 corners vs Barcelona in November:** This was at Camp Nou, not San Mamés. It was also a 4-0 loss where Athletic crossed 19 times in desperation. A similar desperation scenario could recur, but the personnel are different (Williams likely played that game; he's now injured). Discounted accordingly.

---

## Phase 3 — Value Identification

### **CANNOT COMPLETE**

No corner odds were provided in the report. Without bookmaker lines, it is impossible to:
- Calculate implied probabilities
- Identify edges
- Make value picks

This phase is void.

---

## Phase 4 — Output

### Statistical Summary

| Metric | Athletic Bilbao (Home) | Barcelona (Away) |
|--------|----------------------|-------------------|
| Home/Away avg corners won | ~5.65 (n≈13, web) | 6.67 (n=9, report) |
| Home/Away avg corners conceded | ~3.77 (web) | 3.89 (n=9, report) |
| All-games avg corners won | ~5.38–5.50 (web) | 7.10 (n=20, report) |
| All-games avg corners conceded | ~3.88–4.00 (web) | 3.45 (n=20, report) |
| H2H avg corners (matching venue) | N/A (n=0) | N/A (n=0) |
| H2H avg corners (reverse fixture) | 7 (n=1) | 5 (n=1) |
| H2H avg total | 12 (n=1, reverse only) | - |
| League avg total | ~9.64 | - |

**Predicted total:** 7–14 (central **10.0**)
**Predicted spread:** Athletic −1.5 (Barcelona favoured)
**Predicted Barcelona corners won:** 6.0 (range 4–9)
**Predicted Athletic corners won:** 4.5 (range 3–7)

### Value Picks

**NO PICKS POSSIBLE.**

Corner odds were unavailable for this event. Without bookmaker lines, no edge calculation can be performed.

### Directional Indicators (For When Odds Become Available)

If odds are posted, the following leanings merit investigation:

1. **Under 10.5 total corners** — Athletic's home O10.5 rate is just 46%. Barcelona's away games hit O10.5 in ~56% of cases, but two key wide players (Koundé, Williams) are absent. The data suggests the under side has a slight lean at the 10.5 line. Look for implied probability below ~55% for value on the under.

2. **Barcelona corner handicap −1.5** — Barcelona's away corners won (6.67) exceeds Athletic's home corners won (5.65) by ~1.0, and Athletic lose their most dangerous winger. A spread of −1.5 to −2.0 favouring Barcelona aligns with the data.

3. **Under on Athletic team total corners** — With Williams out and Barcelona's possession dominance (their opponents average just 3.45 corners conceded), Athletic may struggle to reach 5 corners. If a line is offered at 4.5 or 5.5, the under could carry value.

### Bets to Avoid

- **Over totals at 11.5+** — tempting given Barcelona's season-long high-corner profile (62% of all games O10.5 per soccerstats), but the specific matchup conditions (San Mamés, Williams out, Koundé out, potential Barcelona rotation pre-Newcastle) all suppress corner generation. The 11.5+ would need a high-confidence 55%+ probability that the data does not support.

### Caveats

1. **No Athletic match-level data available.** All Athletic figures come from web aggregates — no game-by-game variance analysis, no formation correlation, no lineup-specific insights, no substitution pattern analysis. This is the single biggest limitation.
2. **No odds available.** The entire value identification phase is inoperative.
3. **No H2H data** beyond one reverse fixture 3.5 months ago at a different venue.
4. **Barcelona rotation risk** is real with Champions League R16 vs Newcastle three days later. If Flick rests attacking starters (Yamal, Raphinha), corner output could drop materially — but this is speculative.
5. **Lewandowski fitness** — wearing a mask after a facial fracture introduces uncertainty. If he doesn't start, Barcelona lose their primary set-piece target, reducing corner effectiveness (fewer "second ball" situations after delivery).

**Recommendation:** Re-evaluate once odds are posted and, ideally, once Athletic's match-level data becomes available. The directional lean is toward **Under totals** and **Barcelona corner spread**, but no confident picks can be made without lines to price against.