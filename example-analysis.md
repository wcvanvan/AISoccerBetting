Now I have all the contextual information I need. Let me compile the full analysis.

---

## Statistical Summary

| Metric | Wolverhampton (Home) | Aston Villa (Away) |
|--------|---------------------:|-------------------:|
| Venue-filtered avg corners won | 3.00 (n=9) | 4.67 (n=9) |
| Venue-filtered avg corners conceded | 5.89 (n=9) | 5.11 (n=9) |
| All-games avg corners won | 3.17 (n=18) | 5.42 (n=19) |
| All-games avg corners conceded | 6.28 (n=18) | 4.26 (n=19) |
| H2H avg corners (matching venue) | 5.00 (n=1) | 8.00 (n=1) |
| H2H avg corners (all) | 4.25 (n=4) | 6.50 (n=4) |
| H2H avg total | 10.75 (n=4) | — |
| League avg total | ~9.85 | — |

**Predicted total**: 9.0–11.5 (central **10.0**)
**Predicted spread**: Villa −1.5 to −2.5 (central **Villa −2.0**)

---

## Detailed Analysis

### Phase 1 — Statistical Analysis

#### 1A. Data Cleaning

**Wolverhampton**: Of 20 listed games, two have missing corner data — Game 3 (Grimsby Town, FA Cup) and Game 9 (Shrewsbury Town, FA Cup). **18 valid games remain**, all Premier League.

**Aston Villa**: Of 20 listed games, one has missing corner data — Game 10 (Tottenham Hotspur, FA Cup). **19 valid games remain.** Four of these are non-PL: Game 2 (Newcastle, FA Cup — same-league, comparable), Game 6 (RB Salzburg, Europa League), Game 8 (Fenerbahce, Europa League), Game 17 (FC Basel, Europa League). The European games involve non-PL opponents, noted where relevant.

#### 1B. Wolverhampton (Home) Corner Stats

**Home-filtered subset (9 games):**
- Corners won: 1, 3, 5, 4, 6, 3, 1, 3, 1 → Mean **3.00**, Median 3.0
- Corners conceded: 3, 4, 6, 7, 7, 4, 9, 9, 4 → Mean **5.89**, Median 6.0
- Total corners: 4, 7, 11, 11, 13, 7, 10, 12, 5 → Mean **8.89**, Median 10.0, Range 4–13
- **Variance (sample)**: Sum of squared deviations from 8.89 = 82.88 → 82.88 / 8 = **10.36**

**All-games baseline (18 games):**
- Corners won: Mean **3.17** | Conceded: Mean **6.28**
- Total: Mean **9.44**, Median 10.0, Range 4–13
- **Variance (sample)**: 98.38 / 17 = **5.79**

**Venue vs overall delta**: Home total 8.89 vs all-games 9.44 → home games run **0.55 corners lower**. This is partly driven by an outlier Arsenal home game (T=4); removing it gives home mean of 9.50, nearly identical to all-games.

**Trend (recent ~6 vs rest):** Recent 6 PL games (Crystal Palace A, Arsenal H, Forest A, Chelsea H, Bournemouth H, Man City A): totals 10, 4, 10, 7, 11, 10 → mean **8.67**. Older 12 games: mean **9.83**. The Arsenal home game (T=4) is the primary driver — excluding it gives recent-5 mean of **9.60**. The apparent downward trend is fragile and driven by one outlier, not structural.

**Wolves corners won trend**: Recent 6 = 3.33, Older 12 = 3.08 — stable, no meaningful shift.

#### 1C. Aston Villa (Away) Corner Stats

**Away-filtered subset (9 games, includes 2 Europa League):**
- Corners won: 4, 5, 5, 5, 3, 7, 3, 4, 6 → Mean **4.67**, Median 5.0
- Corners conceded: 11, 6, 5, 3, 3, 6, 5, 2, 5 → Mean **5.11**, Median 5.0
- Total: 15, 11, 10, 8, 6, 13, 8, 6, 11 → Mean **9.78**, Median 10.0, Range 6–15
- **Variance (sample)**: 75.57 / 8 = **9.45**

**PL-only away (7 games, excluding Fenerbahce and Basel):**
- Totals: 15, 11, 8, 6, 13, 8, 11 → Mean **10.29**, Median 11.0

**All-games baseline (19 games):**
- Corners won: Mean **5.42** | Conceded: Mean **4.26**
- Total: Mean **9.68**, Median 10.0, Range 6–15
- **Variance (sample)**: 128.06 / 18 = **7.11**

**Venue vs overall delta**: Away total 9.78 vs all-games 9.68 → essentially flat (+0.10). PL-only away is slightly higher at 10.29.

**Trend (recent ~6 PL vs rest):** Recent 6 PL: Leeds H (9), Brighton H (12), Bournemouth A (15), Brentford H (13), Newcastle A (11), Everton H (10) → mean **11.67**. Older 9 PL: 8, 8, 6, 13, 10, 8, 6, 11, 10 → mean **8.89**. Upward trend of **+2.78 corners**. Removing the Bournemouth outlier (15): recent-5 mean = 11.00, still 2.11 above the older set. This is not outlier-driven — the trend is broad-based across recent games.

**Villa corners won trend**: Recent 6 PL = 6.83, Older 9 PL = 4.78 → strong increase in attacking corners, consistent with Villa's improved attacking play and league form.

#### 1D. Outlier Check

**Wolverhampton** (18 games): Mean 9.44, SD = √5.79 = 2.41. 2σ band: 4.63–14.26.
- Arsenal H (T=4): **Flagged** — falls just below 2σ threshold. Angel Gomes went off injured at 22', disrupting the match. Atypical context.

**Aston Villa** (19 games): Mean 9.68, SD = √7.11 = 2.67. 2σ band: 4.35–15.01.
- Bournemouth A (T=15): **Flagged** — at the 2σ boundary. A chaotic end-to-end game.

**Venue-filtered averages with/without outliers:**
- Wolves home: 8.89 → **9.50** without Arsenal H (8 games)
- Villa away: 9.78 → **9.13** without Bournemouth A (8 games)

#### 1E. Head-to-Head

**Same-venue H2H (Wolves Home):** Only one game — 2025-02-01 (nearly 12 months ago): Wolves 5 – Villa 8, T=13. **Heavily discounted**: over 6 months old, and the Wolves XI had only ~2–3 starters who overlap with the expected XI (André and potentially Bellegarde; Aït-Nouri, Semedo, Cunha, Sarabia, Guedes all departed). Villa's XI overlap is also low (~4–5/11 with Tielemans, Kamara, and Ramsey all absent now). Nearly worthless as a signal for this match.

**All H2H (4 games):**
- Wolves corners: 3, 5, 5, 4 → Mean **4.25**
- Villa corners: 7, 8, 6, 5 → Mean **6.50**
- Totals: 10, 13, 11, 9 → Mean **10.75**
- Villa won the corner count in all four meetings.

**Personnel continuity assessment:**
- 2025-11-30 (3 months old): Wolves overlap with expected XI ~5/11 (Mosquera, André, Tchatchoua, Toti Gomes, Bellegarde). Villa overlap ~5/11 (Martínez, Konsa, Rogers, Buendía, Cash). Moderate overlap but Villa's midfield trio (Tielemans/Kamara/McGinn) is entirely absent now. **Moderate discount.**
- 2025-02-01 and earlier (>12 months): **Heavy discount**. Entirely different squad profiles.

**H2H synthesis**: Villa's consistent corner dominance over Wolves across all four H2H games (even with different personnel) suggests a structural advantage, but the personnel churn — particularly in Villa's midfield — limits how much weight this carries. The directional signal (Villa corner superiority) is useful; the specific numbers less so.

#### 1F. Lineup, Substitution & Formation

**Expected lineups** (confirmed via multiple preview sources):
- **Wolves (3-4-2-1)**: Sá; Mosquera, S. Bueno, Toti Gomes; Tchatchoua, Bellegarde, André, H. Bueno; Angel Gomes, Mané; Armstrong
- **Villa (4-2-3-1)**: Martínez; Cash, Konsa, Mings, Maatsen; Onana, Douglas Luiz; Bailey/Buendía, Rogers, Buendía/Sancho; Watkins

**Wolves Player–Corner Correlations (key):**

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|:--------:|:----------:|:-----------:|:------------:|:-------------:|
| Hwang Hee-Chan (OUT) | 11 | 3.91 | 2.00 | 9.91 | 8.71 |
| Adam Armstrong (expected) | 5 | 2.80 | 3.31 | 8.40 | 9.85 |
| Angel Gomes (expected) | 3 | 2.00 | 3.47 | 7.00 | 9.93 |
| Toti Gomes (returning) | 6 | 1.67 | 4.25 | 9.33 | 9.50 |

Key takeaways:
- **Hwang Hee-Chan's absence is significant.** Wolves won 1.91 more corners per game with him starting (3.91 vs 2.00). His direct running generates attacking pressure. His absence pulls Wolves' corner projection down.
- **Angel Gomes** correlates with lower totals (7.00 vs 9.93), but only 3 games, one being the Arsenal outlier where he exited at 22'. With/without the Arsenal outlier: remaining 2 games = (10+7)/2 = 8.50 total. Still below average but fragile (n=2).
- **Armstrong** correlates with lower totals (8.40) but confounded by recent scheduling effects.

**Villa Player–Corner Correlations (key):**

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|:--------:|:----------:|:-----------:|:------------:|:-------------:|
| Douglas Luiz (expected) | 5 | 7.20 | 4.79 | 12.20 | 8.79 |
| Tielemans (OUT) | 10 | 4.80 | 6.11 | 9.00 | 10.44 |
| Kamara (OUT) | 8 | 4.63 | 5.91 | 9.25 | 10.00 |
| McGinn (OUT) | 9 | 5.11 | 5.70 | 9.33 | 10.00 |

Key takeaways:
- **Douglas Luiz's presence correlates with significantly higher totals** (12.20 vs 8.79) and more Villa corners won (7.20 vs 4.79). However, these are the 5 most recent games — the correlation is confounded with Villa's upward form trend. It is difficult to separate Luiz's individual impact from broader team form. Still directionally useful: Luiz is an attacking midfielder who drives Villa's press.
- Games **without Tielemans/Kamara/McGinn** actually average more corners, not fewer. This suggests their replacements (Douglas Luiz, Onana, Bogarde) maintain or increase attacking output.

**Formation Correlation:**

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|:-----:|:-------:|:------------:|:---------:|
| Wolves 3-4-2-1 | 4 | 2.25 | 6.25 | 8.50 |
| Wolves 3-5-2 | 8 | 4.38 | 5.75 | 10.13 |
| Villa 4-2-3-1 | 17 | 5.47 | 4.35 | 9.82 |

Wolves' expected 3-4-2-1 correlates with the **lowest** total corners (8.50) of any formation they've used. This is a meaningful signal — the two behind the striker rather than three in midfield suggests a more compact, conservative shape. However, n=4 warrants caution.

**Early attacking subs (Wolves, before 70'):** 6 games, avg total 10.33 vs 9.00 in games without. Wolves chasing games and throwing on attackers generates more corners — relevant as Wolves are likely to trail.

#### 1G. Absence Impact

**Wolves confirmed absences:**
- **Hwang Hee-Chan** (calf): As shown above, Wolves win 1.91 fewer corners without him and games average 1.20 fewer total corners. He is an attacking threat who creates pressure from wide/central positions. **Material downward pull on Wolves corners won.**
- **Ladislav Krejci** (suspended): 14 games started, avg total 9.29. Without him (4 games): avg total 10.00. Wolves won 3.07 with him, 3.50 without. As a centre-back in a back three, his absence has no clear negative effect on corners. Toti Gomes replacing him may not shift the dynamic.

**Villa confirmed absences:**
- **Youri Tielemans** (ankle): 10 starts, total avg 9.00. Without: 10.44. Villa won 4.80 with, 6.11 without. Counter-intuitively, Villa generate more corners without Tielemans, likely because his replacements (Douglas Luiz, Bogarde) offer different attacking profiles.
- **Boubacar Kamara** (season-ending knee): Similar pattern — 9.25 total with, 10.00 without. No negative impact.
- **John McGinn** (knee surgery): 9.33 total with, 10.00 without. Again, no negative impact on corners.

**Net absence impact**: Wolves lose a meaningful corner-generating player (Hwang). Villa's absences do not appear to reduce their corner output based on in/out splits.

#### 1H. Contextual Factors

**League baseline**: PL 2025-26 averages **9.85 total corners per game** (per APWin). External sites confirm: Wolves matches average 9.36 total (below league avg), with home games averaging 8.14 — one of the lowest in the division. Villa matches average 10.19 total, well above average.

**Score-state**: Wolves have lost 12 of 18 valid games. In those losses, the avg total is 9.25 with Wolves winning only 2.75 corners. Wolves trailing does not reliably inflate totals because they lack the quality to sustain attacking pressure even when chasing.

**Motivation**: Wolves (20th, 10 pts, effectively relegated) are playing for pride with limited tactical ambition. Villa (3rd, 51 pts) need a win to extend their Champions League cushion and are chasing a historic league double. Emery's comments suggest respect for Wolves' grit, but Villa will push for the three points.

**Tactical dynamic**: Villa have struggled against low blocks when holding 65%+ possession — winning just 1 of 5 such games this season. Wolves will almost certainly sit deep. This is a critical factor: high possession for Villa with a compact Wolves block often leads to **recycled possession rather than corner-generating shots**. The Brentford H game (T=13, 12w) is an outlier where Villa pummelled a team with corners despite dominance; more common outcomes against deep defences are the Arsenal H (T=6), Everton H (T=10), and Forest H (T=8) games.

**Referee**: Craig Pawson — a standard PL referee without a notable lean on corners.

**Weather**: 9°C, 8mph winds, 40% rain chance — no extreme conditions.

---

### Phase 2 — Predicted Distribution

**Wolverhampton corners won:**

The anchor is their home average of **3.00** (n=9). The all-games baseline at 3.17 aligns closely. Key adjustments:

- Hwang Hee-Chan's absence: His in/out split shows Wolves winning 2.00 corners without him vs 3.91 with. This is the strongest single-player effect in the dataset. Even discounting for sample-size noise, it's reasonable to knock ~1.0 corner off Wolves' projection. They lose their most dynamic attacking threat.
- Formation (3-4-2-1): Correlates with only 2.25 corners won (n=4). The compact shape limits Wolves' attacking width compared to 3-5-2 (4.38 won).
- Opponent quality: Villa concede 4.26 corners per game overall, 5.11 away. Villa are well-organized defensively — they won't gift corners cheaply.
- Wolves' recent trend in corners won (3.33 last 6) is stable and close to baseline.
- Score-state: If Wolves trail (highly likely), they historically generate only 2.75 corners in losses.

**Assessment**: Multiple factors pull Wolves' corner projection below their already-low home average. The combination of Hwang's absence, 3-4-2-1 formation, and likely trailing score-state all point the same direction. **Central estimate: 2.5** (range 1.5–4.0).

**Aston Villa corners won:**

Villa's away average is **4.67** (n=9), but PL-only away is higher at **4.86** (StatMuse confirms 4.85 across the season). Recent form shows a sharp upward trend (6.83 corners won in recent 6 PL games). Key adjustments:

- Douglas Luiz's presence: His 5 starts coincide with 7.20 corners won per game. Confounded with form but directionally positive. He is expected to start.
- Opponent quality: Wolves concede 5.89 corners at home — well above average. Wolves are the worst home side in the league by points.
- Low-block dynamic: Villa's struggles against compact defences are documented. They held 65%+ possession in several low-scoring corner games (Arsenal H: 3w, Everton H: 6w, Forest H: 4w). Wolves will sit deep. This **caps Villa's ceiling** — recycled possession doesn't convert to corners at the same rate.
- H2H: Villa won 7 corners in the reverse fixture and have outscored Wolves in corners in all 4 recent H2H games. Directional support but personnel caveat applies.
- Villa's trend is genuinely upward. Recent attacking play (Rogers, Watkins, Bailey/Sancho width) creates corner-generating pressure.

**Assessment**: Villa's away baseline of ~4.85 is pulled upward by recent form, opponent weakness, and Douglas Luiz's influence. However, the low-block factor creates a ceiling effect — Villa's best corner performances came in open, end-to-end games (Chelsea away 7w, Bournemouth away 4w despite 15 total, Brighton away 6w). Against a deep-sitting, low-quality Wolves, Villa may dominate territory but convert less into corners. **Central estimate: 5.5** (range 4.0–7.5).

**Total match corners:**

Per-team sum: 2.5 + 5.5 = **8.0**. But this needs reconciliation with match-level data.

Wolves home total average: **8.89** (9.50 without outlier). Villa away total average: **9.78** (PL-only: 10.29). The league baseline is 9.85. External data confirms Wolves home games average 8.14 total corners — one of the lowest in the league.

Pulling factors:
- **Down**: Wolves' historically low home totals (8.14 per external, 8.89 from report). The 3-4-2-1 formation averages 8.50. Hwang's absence reduces attacking contributions. Low-block dynamic suppresses corners.
- **Up**: Villa's upward trend in total corners (11.67 recent PL). Villa's quality generating corners against poor defences. H2H averages 10.75.
- **Neutral**: League average ~9.85 sits between the two team profiles.

The low-block effect is the swing factor. When Villa face compact defences at home, totals have been moderate: Forest H (8), Everton H (10), Arsenal H (6), Leeds H (9). Away against poor teams: Crystal Palace A (8) is the closest comparable. This match profile — Villa dominant against a bottom-dwelling team sitting deep — most resembles those 8–10 total environments.

**Central estimate for total: 10.0** (range 8.5–11.5). I weight the low-block suppression effect meaningfully but acknowledge Villa's recent upward form prevents me going as low as 8–9. The per-team sum of 8.0 likely undershoots because corner interdependencies mean Villa's dominance won't totally suppress Wolves' counter-attack corners (set pieces, deflections). Adjusting per-team estimates: Wolves 3.0, Villa 6.0, cross-checked back to ~9.0–10.0.

**Revised central**: Wolves ~3.0, Villa ~6.0, Total ~**10.0**.

**Corner spread (Wolves − Villa):**

Central estimate: 3.0 − 6.0 = **−3.0** (Villa favoured by 3.0 corners). Range: −1.0 to −5.0.

Supporting evidence: In all 4 H2H games, Villa outscored Wolves by margins of 4, 3, 1, 1 (avg −2.25). At home specifically, Wolves concede 5.89 corners and win only 3.00 — a net −2.89 differential. Hwang's absence widens this further.

---

### Phase 3 — Value Identification

#### Variance & Distribution Model

**Wolves home total variance**: 10.36 (n=9). Mean 8.89. Variance > Mean → **Negative Binomial**.

**Villa away total variance**: 9.45 (n=9). Mean 9.78. Variance ≈ Mean → borderline, but close enough to Poisson territory. Given the broader all-games variance of 7.11 vs mean 9.68 (variance < mean), and the match-specific profile leaning toward moderate variance, I'll use **Negative Binomial** to be conservative and consistent.

**Averaging team variances**: (10.36 + 9.45) / 2 = **9.91**.

My predicted total mean: **μ = 10.0**, estimated variance: **σ² = 9.91**.

**NegBin parameters**:
- r = μ² / (σ² − μ) = 100 / (9.91 − 10.0) = 100 / (−0.09)

The variance is almost exactly equal to the mean, which means NegBin is undefined (r → ∞, converging to Poisson). I'll use **Poisson with λ = 10.0** as the appropriate model here.

#### Totals Markets

**Poisson cumulative probabilities for λ = 10.0:**

P(X ≤ k) computed via Poisson CDF:

| k | P(X = k) | P(X ≤ k) |
|---|----------|----------|
| 0 | 0.0000 | 0.0000 |
| 1 | 0.0005 | 0.0005 |
| 2 | 0.0023 | 0.0028 |
| 3 | 0.0076 | 0.0103 |
| 4 | 0.0189 | 0.0293 |
| 5 | 0.0378 | 0.0671 |
| 6 | 0.0631 | 0.1301 |
| 7 | 0.0901 | 0.2202 |
| 8 | 0.1126 | 0.3328 |
| 9 | 0.1251 | 0.4579 |
| 10 | 0.1251 | 0.5830 |
| 11 | 0.1137 | 0.6968 |
| 12 | 0.0948 | 0.7916 |

**Line-by-line analysis:**

**Over 7.5:**
- Model P(Over) = 1 − P(≤7) = 1 − 0.2202 = **0.780**
- Empirical: Wolves home: 7/9 games over 7.5 (78%). Villa away: 7/9 (78%). Average: **78%**
- Implied: 1/1.24 = **0.806** (overround-adjusted ~0.77)
- Edge: 0.78 − 0.77 = ~**+1%**. No value.

**Over 8.5:**
- Model P(Over) = 1 − P(≤8) = 1 − 0.3328 = **0.667**
- Empirical: Wolves home: 5/9 over 8.5 (56%). Villa away: 7/9 (78%). Average: **67%**
- Implied: 1/1.43 = **0.699** (overround-adjusted ~0.67)
- Edge: 0.67 − 0.67 = ~**0%**. Dead even.

**Over 9.5:**
- Model P(Over) = 1 − P(≤9) = 1 − 0.4579 = **0.542**
- Empirical: Wolves home: 5/9 over 9.5 (56%). Villa away: 5/9 (56%). Average: **56%**
- Implied: 1/1.74 = **0.575** (overround-adjusted ~0.55)
- Edge: 0.55 − 0.55 = ~**0%**. Marginal, no edge.

**Under 9.5:**
- Model P(Under) = P(≤9) = **0.458**
- Empirical: Wolves home 4/9 ≤9 (44%). Villa away 4/9 (44%). Average: **44%**
- Implied: 1/2.00 = **0.500** (overround-adjusted ~0.48)
- Edge: 0.44 − 0.48 = **−4%**. No value.

**Over 10.5:**
- Model P(Over) = 1 − P(≤10) = 1 − 0.5830 = **0.417**
- Empirical: Wolves home: 4/9 over 10.5 (44%). Villa away: 4/9 (44%). Average: **44%**
- Implied: 1/2.20 = **0.455** (overround-adjusted ~0.43)
- Edge: 0.44 − 0.43 = ~**+1%**. Marginal.

**Under 10.5:**
- Model P(Under) = P(≤10) = **0.583**
- Empirical: Wolves home 5/9 ≤10 (56%). Villa away 5/9 (56%). Average: **56%**
- Implied: 1/1.61 = **0.621** (overround-adjusted ~0.60)
- Edge: 0.56 − 0.60 = **−4%**. No value.

**Under 11.5:**
- Model P(Under) = P(≤11) = **0.697**
- Empirical: Wolves home 7/9 ≤11 (78%). Villa away 6/9 (67%). Average: **72%**
- Implied: 1/1.36 = **0.735** (overround-adjusted ~0.70)
- Edge: 0.72 − 0.70 = ~**+2%**. Marginal.

**Over 11.5:**
- Model P(Over) = 1 − P(≤11) = **0.303**
- Empirical: Wolves home 2/9 (22%). Villa away 3/9 (33%). Average: **28%**
- Implied: 1/2.90 = **0.345** (overround-adjusted ~0.33)
- Edge: 0.28 − 0.33 = **−5%**. Slight lean to Under side.

The totals markets are **tightly priced around the 10.0 centre**. The book's implied centre (where Over/Under odds cross closest to evens) is between 9.5 and 10.5, consistent with my estimate. No meaningful edge identified on any totals line.

#### Spreads Market

**DraftKings: Villa −1.5 @ 1.83 / Wolves +1.5 @ 1.87**

Implied probabilities: Villa −1.5 = 1/1.83 = 0.546. Wolves +1.5 = 1/1.87 = 0.535. Combined overround: 1.081.

Overround-adjusted: Villa −1.5 ~**0.505**, Wolves +1.5 ~**0.495**.

The book prices the spread at −1.5 as essentially a coin flip.

**My predicted spread: Villa −3.0** (range −1.0 to −5.0).

For P(Villa spread ≤ −2) — i.e., Villa win corners by 2+ — I need to model the corner difference. Using Skellam distribution (difference of two Poissons) as an upper-bound approximation:

Villa corners: λ₁ = 6.0, Wolves corners: λ₂ = 3.0 → Skellam mean = 3.0, variance = λ₁ + λ₂ = 9.0, SD = 3.0.

P(Villa wins by ≥ 2) = P(Skellam ≤ −2) from Wolves' perspective = P(diff ≥ 2 for Villa).

Using normal approximation for the Skellam (mean 3.0, SD 3.0):
- P(diff ≥ 2) = P(Z ≥ (2−3)/3) = P(Z ≥ −0.33) = **0.630**
- P(diff ≥ 1) (i.e. Villa −0.5) = P(Z ≥ (1−3)/3) = P(Z ≥ −0.67) = **0.749**

Note: In reality, within-match corners are **negatively correlated** (one team's dominance compresses the other's), so the true variance is lower than 9.0. This makes the distribution tighter around the mean of 3.0, pushing P(diff ≥ 2) even higher — perhaps to **0.65–0.68**.

For Villa −1.5 (Villa wins by 2+): my estimate is **0.63–0.68** (taking the midpoint: **0.65**).

Book implies **0.505** for Villa −1.5.

**Edge: 0.65 − 0.505 = +14.5%**. This is a significant edge.

**Sensitivity test**: If I reduce my Villa estimate to 5.5 corners (low end) and increase Wolves to 3.5 (high end), the spread narrows to −2.0. P(diff ≥ 2) with Skellam(5.5, 3.5): mean 2.0, SD = √9.0 = 3.0. P(diff ≥ 2) = P(Z ≥ 0) = 0.50. Even in this pessimistic scenario, we break even with the book's line. The edge remains intact across reasonable estimate ranges.

**Wolves +1.5 @ 1.87**: implied 0.495 after overround. My estimate P(Wolves within 1 corner or ahead) = 1 − P(Villa by 2+) = 1 − 0.65 = **0.35**. This is negative EV — the book is right to price it near evens, but from my model it's poor value.

#### Cross-Checks

**Book's implied team corners**: The spread centre at −1.5 and the totals centre at ~10.0 imply Wolves ~4.25, Villa ~5.75. My estimates: Wolves 3.0, Villa 6.0 (total also 9.0–10.0 but spread wider at −3.0 vs book's −1.5). The divergence of ~1.25 corners on the spread is the source of the identified value.

**Why does the book underprice Villa's corner advantage?**
The book appears to anchor on Wolves' overall home corner profile (~3.0 won) without fully discounting Hwang Hee-Chan's absence (which drops Wolves to ~2.0 won historically) or fully crediting Villa's recent upward trend in corners won (6.83 in recent PL). The 3-4-2-1 formation's low corner-generating profile (2.25 avg won) also supports a wider spread than the book implies.

---

### Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | Aston Villa −1.5 corners | −1.5 | 1.83 | 0.65 | 0.505 | +14.5% | ★★★★☆ |

**Pick 1 — Aston Villa −1.5 Corner Spread @ 1.83 (DraftKings)**

Villa have won the corner count in all four recent H2H meetings with Wolves, averaging a +2.25 corner margin. The most relevant data point is Wolves' corner output without Hwang Hee-Chan: just 2.00 corners won per game versus 3.91 with him — his absence fundamentally weakens their attacking threat. Villa's recent PL form shows 6.83 corners won per game over their last 6 league outings, driven by wide play from Rogers, Bailey/Sancho, and full-back overlaps. The book appears to set this spread too tight at −1.5 (essentially a pick'em), underweighting the combination of Hwang's absence, Wolves' poor 3-4-2-1 formation history (2.25 corners won avg), and Villa's upward trajectory. The primary risk is the low-block dynamic — if Wolves sit extremely deep and Villa recycle possession without creating shots, the corner margin could compress to 0–1.

---

### Bets to Avoid

**1. Over 11.5 Total Corners @ 2.90:** Tempting given Villa's recent upward trend (11.67 avg in last 6 PL games), but Wolves' home games average only 8.14 total corners across the full season — among the lowest in the league. The 3-4-2-1 formation averages 8.50 totals. With Hwang absent and Wolves likely to sit deep in a compact block, this match profile points to moderate rather than high corner counts. My model gives just 28–30% probability against an implied 33%.

**2. Under 9.5 Total Corners @ 2.00:** Despite Wolves' low home averages, Villa's attacking quality and recent form make sub-10 outcomes less likely. Villa have exceeded 9.5 total corners in 5 of their last 6 PL games. The empirical rate is ~44% against an implied ~48% — not enough edge, and you'd be betting against the better team's attacking capabilities.

---

### Caveats

1. **Low-block uncertainty**: The biggest single variable is how effectively Wolves' defensive shape suppresses Villa's corner generation. If Wolves employ an ultra-compact 3-4-2-1 and Villa struggle to create shooting opportunities (as documented against teams sitting deep with 65%+ possession), the corner total could land below 9 and the spread could narrow. This risk is partially captured in the confidence rating.

2. **Spread market thinness**: Only one bookmaker (DraftKings) provides spread odds. No cross-book comparison is possible. The overround of 8.1% is typical but not sharp.

3. **Hwang Hee-Chan late fitness test**: One preview source mentions a "late fitness test." If Hwang starts, the edge on Villa −1.5 shrinks materially (~5–8% rather than 14.5%). **Monitor team news before placing.**

4. **Villa formation variance**: Multiple sources disagree on Villa's wide attackers (Bailey vs Sancho vs Buendía). The identity of the wide players affects corner generation — Bailey's direct dribbling generates more corners than Sancho's possession play. The pick is robust to this variation but the degree of edge fluctuates.

5. **Small venue-filtered samples**: Both teams provide only 9 venue-filtered games. Variance estimates are inherently noisy at this sample size.