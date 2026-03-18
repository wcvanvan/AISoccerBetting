I'll analyze this match systematically. Let me first check for any additional contextual information.

## Statistical Summary

| Metric | Liverpool (Home) | Tottenham (Away) |
|--------|-----------------|-----------------|
| Venue-filtered avg corners won | 6.71 (n=7 PL) | 4.00 (n=8 PL) |
| Venue-filtered avg corners conceded | 4.29 | 4.50 |
| All-games avg corners won | 6.72 (n=18) | 4.53 (n=19) |
| All-games avg corners conceded | 4.00 | 4.58 |
| H2H avg corners (matching venue) | 11.0 (n=2) | 3.0 (n=2) |
| H2H avg corners (all) | 7.0 (n=5) | 3.4 (n=5) |
| H2H avg total | 10.4 (n=5) | — |
| League avg total | ~10.0–10.5 | — |

**Predicted total**: 7–13 (central 10.0)
**Predicted spread**: Liverpool −4.0 / Tottenham +4.0

---

## Detailed Analysis

### Phase 1 — Statistical Analysis

#### 1A. Data Cleaning

**Liverpool**: 18 valid games from 20. Games 4 (Brighton FA Cup, Feb 14) and 12 (Barnsley FA Cup, Jan 12) have corners marked "-". Three CL games carry data — vs Qarabag (H), Marseille (A), Inter (A) — all non-PL opponents, flagged as non-comparable.

**Tottenham**: 19 valid games from 20. Game 11 (Aston Villa FA Cup, Jan 10) has corners marked "-". Three CL games carry data — vs Frankfurt (A), Dortmund (H), Slavia Prague (H) — all non-PL opponents, flagged as non-comparable.

#### 1B. Liverpool (Home) Corner Stats

**Venue-filtered (Home PL, 7 games):**
- Corners won: 10, 5, 7, 9, 8, 6, 2 → mean 6.71, median 7, range 2–10
- Corners conceded: 5, 4, 11, 1, 3, 4, 2 → mean 4.29, median 4
- Total corners: 15, 9, 18, 10, 11, 10, 4 → mean 11.0, median 10, range 4–18
- Total variance (sample): [(15−11)² + (9−11)² + (18−11)² + (10−11)² + (11−11)² + (10−11)² + (4−11)²] / 6 = 120/6 = **20.0**, SD = 4.47

Including the Qarabag CL game (14w-1c, total 15) pushes the home mean to 7.63 won and 11.5 total. I use the PL-only figures as the primary anchor because the CL game against a vastly inferior side (6-0 win) inflates the numbers artificially.

**All-games baseline (18 valid):**
- Corners won: mean 6.72, median 6.5, range 0–14
- Corners conceded: mean 4.00, median 3
- Total corners: mean 10.72, median 10.5, range 3–18
- Total variance (sample): 241.6/17 = **14.21**, SD = 3.77

**Venue vs overall delta:** Home PL total (11.0) sits +0.28 above all-games (10.72) — a modest home premium. Home corners won (6.71) is essentially flat vs all-games (6.72); the larger delta only appears when the Qarabag CL game is included.

**Trend (recent 6 valid games vs older 12):**
- Recent 6 totals: 13 (Wolves A), 15 (West Ham H), 9 (Forest A), 14 (Sunderland A), 9 (Man City H), 18 (Newcastle H) → mean **13.0**
- Older 12 totals: mean **9.58**
- Recent 6 corners won: mean **7.67** vs older 12: **6.25**

The recent uptick (+3.4 total, +1.4 won) is notable but partly driven by the Newcastle home game (18 total). Removing Newcastle, the recent 5 still average 12.0 — sustained elevation. Plausible causal explanation: Liverpool's recent shift to a more attacking approach with Ekitike, Gakpo, and the fullback pairing of Kerkez/Frimpong providing width. The trend has support and is not purely outlier-driven.

**Threshold frequencies (Liverpool home PL, 7 games):**

| Line | Games Over | % Over |
|------|-----------|--------|
| 8.5 | 6 of 7 | 85.7% |
| 9.5 | 5 of 7 | 71.4% |
| 10.5 | 3 of 7 | 42.9% |
| 11.5 | 2 of 7 | 28.6% |
| 12.5 | 2 of 7 | 28.6% |

Liverpool at home exceed 9.5 in 71.4% of PL games — a high-corner-propensity home side, though the 42.9% drop-off at 10.5 highlights that their totals cluster around 10–11 with fat tails (4 and 18).

**Threshold frequencies (Liverpool all-games, 18 valid):**

| Line | Games Over | % Over |
|------|-----------|--------|
| 8.5 | 15 of 18 | 83.3% |
| 9.5 | 11 of 18 | 61.1% |
| 10.5 | 9 of 18 | 50.0% |
| 11.5 | 6 of 18 | 33.3% |
| 12.5 | 6 of 18 | 33.3% |

#### 1C. Tottenham (Away) Corner Stats

**Venue-filtered (Away PL, 8 games):**
- Corners won: 8, 0, 3, 7, 1, 2, 3, 8 → mean 4.00, median 3, range 0–8
- Corners conceded: 5, 7, 1, 3, 3, 3, 3, 11 → mean 4.50, median 3
- Total corners: 13, 7, 4, 10, 4, 5, 6, 19 → mean 8.50, median 6.5, range 4–19
- Total variance (sample): [(13−8.5)² + (7−8.5)² + (4−8.5)² + (10−8.5)² + (4−8.5)² + (5−8.5)² + (6−8.5)² + (19−8.5)²] / 7 = 194.0/7 = **27.71**, SD = 5.26

Without Newcastle outlier (19 total): mean drops to **6.86** (7 games). The Newcastle game massively inflates the average — six of eight away PL games had ≤10 total corners, and five had ≤7.

Including Frankfurt CL away (6w-0c, total 6): away-all mean = 4.22 won, 8.22 total (9 games).

**All-games baseline (19 valid):**
- Corners won: mean 4.53, median 3, range 0–11
- Corners conceded: mean 4.58, median 4
- Total corners: mean 9.11, median 8, range 4–19
- Total variance (sample): 317.8/18 = **17.65**, SD = 4.20

**Venue vs overall delta:** Away PL total (8.50) sits −0.61 below all-games (9.11). Spurs generate fewer total corners on the road, which makes intuitive sense — away teams typically cede territory.

**Trend (recent 6 valid games vs older 13):**
- Recent 6 totals: 9 (Palace H), 13 (Fulham A), 7 (Arsenal H), 14 (Newcastle H), 7 (Man Utd A), 7 (Man City H) → mean **9.50**
- Older 13 totals: mean **8.92** — roughly flat
- Recent 6 corners won: mean **3.50** vs older 13: **5.00** — **declining**

The declining corners-won trend aligns with Spurs' catastrophic form (five straight losses, new manager yet to win). Their attacking output has deteriorated materially.

**Threshold frequencies (Tottenham away PL, 8 games):**

| Line | Games Over | % Over |
|------|-----------|--------|
| 8.5 | 3 of 8 | 37.5% |
| 9.5 | 3 of 8 | 37.5% |
| 10.5 | 2 of 8 | 25.0% |
| 11.5 | 2 of 8 | 25.0% |
| 12.5 | 2 of 8 | 25.0% |

Only 37.5% of Spurs away PL games exceed 8.5 total corners — a low-corner-propensity away side. The flat rate from 10.5 through 12.5 (25%) reflects that only Newcastle (19) and Fulham (13) exceeded these thresholds.

**Threshold frequencies (Tottenham all-games, 19 valid):**

| Line | Games Over | % Over |
|------|-----------|--------|
| 8.5 | 8 of 19 | 42.1% |
| 9.5 | 7 of 19 | 36.8% |
| 10.5 | 6 of 19 | 31.6% |
| 11.5 | 5 of 19 | 26.3% |
| 12.5 | 5 of 19 | 26.3% |

#### 1D. Outlier Check

**Liverpool (18 valid games):** Mean total = 10.72, SD = 3.77. 2σ threshold = 18.26. No game exceeds 2σ. Newcastle (H) at 18 is the highest but sits at +1.93σ. On the low end, Arsenal (A) at 3 sits at −2.05σ — a mild outlier explained by Arsenal's elite low-block defensive structure in a 0-0 draw (0 deep completions, 0.32 xG).

**Tottenham (19 valid games):** Mean total = 9.11, SD = 4.20. 2σ threshold = 17.51. **Newcastle (A) at 19 exceeds 2σ** (+2.35σ) — that game featured Newcastle's 40 crosses and 11 corners in an unusually open 2-2 draw.

With outlier: all-games total mean = 9.11; away PL total mean = 8.50.
Without Newcastle outlier: all-games total mean = (173−19)/18 = **8.56**; away PL total mean = (68−19)/7 = **7.00**.

#### 1E. Head-to-Head

**Same-venue H2H (Liverpool Home, 2 games):**

| Date | Comp | Liv | Tot | Total |
|------|------|-----|-----|-------|
| Apr 2025 | PL | 8 | 2 | 10 |
| Feb 2025 | League Cup | 14 | 4 | 18 |

Average: Liverpool 11.0, Tottenham 3.0, Total 14.0. Both games are >6 months old — heavy discount. The League Cup game (18 total, 4-0 win) was a demolition with Liverpool's 25 crosses and 10 blocked shots generating an extreme corner count. The PL game (10 total, 5-1) was more representative.

**All H2H (5 games):**
Liverpool corners: 6, 8, 14, 2, 5 → mean **7.0**
Tottenham corners: 2, 2, 4, 2, 7 → mean **3.4**
Total: 8, 10, 18, 4, 12 → mean **10.4**

Liverpool won the corner battle in 4 of 5 meetings. The sole exception (Dec 2024, Tottenham 7 – Liverpool 5) was a chaotic 6-3 game.

**Personnel continuity:**

*Liverpool vs expected XI (Alisson, Frimpong, Konaté, VVD, Kerkez, Gravenberch, Mac Allister, Salah, Szoboszlai, Gakpo, Ekitike):*
- Dec 2025 (Spurs H, 3 months ago): 8/11 overlap. Missing: Frimpong, Salah, Gakpo. Had: Bradley, Curtis Jones, Wirtz. **Best continuity — most relevant H2H game.**
- Apr 2025 (Liv H, 11 months): 8/11 overlap but different fullbacks (Robertson/TAA vs Kerkez/Frimpong) and Díaz for Ekitike. Significant discount.
- Feb 2025, Jan 2025, Dec 2024: 6-7/11 overlap, all >12 months. Heavily discounted.

*Tottenham vs expected XI (Vicario, Gray, Danso, Dragusin, Porro, Gallagher, Sarr, Spence, Simons, Solanke, Richarlison):*
- Dec 2025: only 4/11 overlap (Vicario, Spence, Porro, Simons). Had Romero, VdV, Bentancur, Bergvall, Kudus — all now absent.
- All older games: 3-5/11 overlap. **Tottenham's H2H personnel continuity is very poor across all meetings.** The squad has been fundamentally reshaped by injuries — Son, Kulusevski, Maddison, Romero, VdV, Kudus, Bentancur all absent.

**H2H conclusion:** The most relevant game is Dec 2025 (8 total, Liverpool 6-2 corners, 2-1 result). Good Liverpool personnel overlap, poor Spurs overlap. Older games are heavily discounted. The consistent pattern of Liverpool corner dominance (mean +3.6) is noted but fragile given Tottenham's squad turnover.

#### 1F. Lineup, Substitution & Formation

**Liverpool formation correlation:**

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 4-2-3-1 | 15 | 6.87 | 3.73 | 10.60 |
| 4-2-2-2 | 2 | 7.50 | 5.00 | 12.50 |
| 4-1-2-1-2 | 1 | 3.00 | 6.00 | 9.00 |

Expected formation today: 4-2-3-1 — well-sampled with 15 games.

**Liverpool player–corner correlation (key players in expected XI):**

| Player | Games Started | Avg Won In | Avg Total In | Avg Won Out | Avg Total Out |
|--------|--------------|-----------|-------------|------------|--------------|
| Salah | 15 | 6.80 | 10.73 | 6.33 | 10.67 |
| Wirtz (doubtful) | 13 | 7.00 | 10.62 | 6.00 | 11.00 |
| Frimpong | 6 (PL) | 7.50 | 10.17 | 6.11 | 10.78 |
| Ekitike | 15 | 6.80 | 11.00 | 6.33 | 9.33 |

**Wirtz in/out**: When Wirtz starts, Liverpool win 7.0 corners per game (vs 6.0 without) but match totals are essentially unchanged (10.62 vs 11.00). His absence — if confirmed — would not materially alter corner expectations. The sample without him (5 games: Wolves A 13, West Ham H 15, Forest A 9, Inter A 9, Leeds A 9) shows Liverpool's corner generation is sustained through other attacking outlets.

**Liverpool early attacking subs (pre-70'):** Games where multiple attacking players exited early include Newcastle H (Wirtz 41', Ekitike 41' → 18 total), Wolves H (Ekitike 42', Wirtz 42' → 10 total), and Brighton H (Gomez 1', Ekitike 1' → 4 total). No consistent pattern — disruption from injuries/subs can go either direction.

**Tottenham formation correlation:**

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 4-2-3-1 | 10 | 5.50 | 4.70 | 10.20 |
| 3-4-2-1 | 3 | 4.00 | 2.67 | 6.67 |
| 4-3-3 | 3 | 1.00 | 7.33 | 8.33 |
| 3-5-2 | 1 | 2.00 | 5.00 | 7.00 |
| 4-4-2 | 1 | 8.00 | 5.00 | 13.00 |
| 3-4-3 | 1 (CL) | 6.00 | 0.00 | 6.00 |

Tudor's expected setup is a 3-4-2-1 or similar back-3 with wingbacks (Gray-Danso-Dragusin; Porro RWB, Spence LWB). In the three 3-4-2-1 games, the average total was only **6.67** — the lowest of any formation with >1 game. Small sample, but directionally consistent with a conservative approach.

**Tottenham player–corner correlation:**

| Player | Games Started | Avg Won In | Avg Total In | Avg Won Out | Avg Total Out |
|--------|--------------|-----------|-------------|------------|--------------|
| Simons | 13 | 5.15 | 10.77 | 3.17 | 5.50 |
| Porro | 14 | 5.21 | 9.43 | 2.60 | 8.20 |
| Solanke | 12 | 4.67 | 9.67 | 4.29 | 8.29 |

**Simons in/out** is the most striking correlation: match totals average 10.77 when he starts vs 5.50 without (13 vs 6 games). Simons is expected to start today, which is a factor pushing the total up. However, some confounding applies — Simons tends to play in bigger matches and his absence correlates with games featuring weaker attacking lineups generally.

**Tottenham early disruptions:** Spurs have had multiple games with 3+ forced early changes: Crystal Palace H (Souza 7', Solanke 34', Kolo Muani 43' → 9 total), Man City H (Bissouma 11', Romero 45', Solanke 48' → 7 total), Man Utd A (Udogie 27', Odobert 32' → 7 total). These heavily disrupted games produced low totals (7, 7, 9). Given Spurs' injury crisis, further in-game disruption is plausible.

#### 1G. Absence Impact

**Liverpool:**
- **Wirtz (doubtful, back issue):** As shown above, in/out delta on match totals is negligible (10.62 vs 11.00). His absence would be compensated by Chiesa or Ngumoha.
- **Bradley (out, ACL):** When Bradley played (5 games), match totals averaged 8.4 vs 11.6 without. This likely reflects sample composition rather than Bradley suppressing corners.
- **Isak, Endo, Leoni:** Not significant corner-related absences.

**Tottenham (massive injury list — 13 players out/doubtful):**
- **Van de Ven (suspended):** Key CB with pace to recover. His absence weakens Spurs' defensive structure and removes an aerial threat from set pieces.
- **Romero (concussion):** Elite CB. Paired with VdV suspension, Spurs' entire first-choice CB pairing is absent.
- **Palhinha (concussion):** Spurs' primary ball-winning midfielder. His absence significantly reduces their ability to win the ball in advanced positions and generate transitions — a key corner-creation pathway for counter-attacking teams.
- **Bissouma (muscle):** Another DM option gone, further depleting midfield.
- **Udogie (hamstring):** Attacking LB whose overlapping runs generate crosses/corners.
- **Odobert (ACL), Kudus (thigh), Bergvall (ankle), Maddison (ACL), Kulusevski (knee), Bentancur (hamstring), Davies (ankle):** All long-term absentees.
- **Gallagher (fever, doubtful):** Tudor said "probably will be in." If he misses, Spurs' midfield options are critically thin.

The cumulative impact is severe. Spurs will field a squad missing their first-choice CB pair, their primary DM, their attacking LB, and multiple creative midfielders. Tudor has described the situation as unprecedented in his career. This supports a low corner prediction for Tottenham — limited attacking personnel means fewer dangerous attacks into the final third.

#### 1H. Contextual Factors

**League baseline:** PL average is approximately 10.0–10.5 total corners. Liverpool's all-games average (10.72) is slightly above; Tottenham's (9.11) is below.

**Score-state:** Liverpool's highest corner games include matches where they dominated early (West Ham H: 5-2, 15T; Newcastle H: 4-1, 18T; Qarabag CL: 6-0, 15T). When leading comfortably, Liverpool can still generate corners from sustained pressure rather than sitting back. However, the Man City home game (9T, 1-2 loss) shows that when an opponent controls the game, Liverpool's corner output drops. Tottenham's highest corner game this season (West Ham H: 16T, 1-2 loss) came while trailing — desperation attacking generated 11 corners won and 43 crosses.

**Motivation & form:**
- **Liverpool (6th, 48 pts):** Fighting for European spots, 3 points behind 5th-place Chelsea. Strong motivation to win at Anfield. However, the UCL second leg vs Galatasaray on Wednesday (3 days later) creates a rotation risk — Slot may rest legs.
- **Tottenham (16th, 29 pts):** One point above the relegation zone. Five consecutive losses. Tudor yet to win as interim manager. Desperation could produce either ultra-defensive pragmatism (protect a point) or reckless attacking. Given the depleted squad and Anfield difficulty, pragmatic defense is more likely. Tudor's quote — "We have a lot of problems to make the first 11" — signals damage limitation.

**Possession-corners decoupling:** Liverpool will likely dominate possession (they average 60.2% at home), but this doesn't automatically translate to corners. When Liverpool controlled possession against Brighton (H), they generated only 4 total corners — because they managed the game through safe passing rather than aggressive final-third attacks. Against deep-sitting opponents (Burnley H: 10T, Leeds H: 11T, Wolves H: 10T), Liverpool's home totals cluster around 10–11. These are the most comparable scenarios to today's match.

### Phase 2 — Predicted Distribution

**Liverpool corners won — central estimate: 7.0 (range 4–10)**

The primary input is Liverpool's own corner-won patterns. Their home PL average is 6.71 (median 7). The recent 6-game trend shows elevated corner winning (7.67 avg), supported by aggressive wing play from Kerkez and Frimpong. Against a severely depleted Tottenham likely to sit deep, Liverpool should have ample territory. Their PPDA at home ranges 6.5–19.7 depending on opponent quality — against weaker sides, they press aggressively (6.5 vs Leeds, 6.9 vs Burnley, 7.4 vs Wolves), which forces errors and corner-generating attacks. Spurs' away conceded rate (4.50 PL avg) is secondary context; against stronger home sides (Man Utd: conceded 7; Fulham: conceded 5), Spurs concede more. Liverpool are a stronger home side than both. The CL rotation risk tempers this by ~0.5 corners, but the core attacking structure (Salah, Gakpo, Ekitike, Szoboszlai) should remain intact. Central estimate: **7.0**.

**Tottenham corners won — central estimate: 3.0 (range 1–5)**

Spurs' away PL average is 4.00 corners won (median 3). The recent decline to 3.50 across all games reflects their current crisis. Away from home excluding the Newcastle outlier, Spurs average just 3.43 won. Against deep-sitting opponents away, Spurs generated very few corners (Burnley: 3, Brentford: 1, Crystal Palace: 2, Forest: 3). While Liverpool aren't a deep-sitting side, they are an organized defensive unit at home — Liverpool's home PL conceded rate is 4.29, but excluding the Newcastle anomaly (11 conceded), it drops to 3.17. Spurs' back-3 formation (avg 4.0 won in 3 games) further limits their attacking corner generation. Their massive injury crisis means Simons and Porro are essentially the only creative threats. Central estimate: **3.0**.

**Total match corners — central estimate: 10.0 (range 7–13)**

The sum of individual estimates (7.0 + 3.0 = 10.0) is consistent with the match-total approach. Liverpool's home PL total average is 11.0, but Spurs' away PL total average is 8.50 (7.00 excl Newcastle outlier). The average of venue-filtered means: (11.0 + 8.50)/2 = 9.75, or (11.0 + 7.00)/2 = 9.00 excluding the Newcastle outlier. Against comparable deep-sitting opponents at home, Liverpool's totals cluster at 10–11 (Burnley 10, Leeds 11, Wolves 10). This represents the most likely scenario — Liverpool generating 7 corners from sustained pressure, Spurs managing 3 on the break. The recent trend and Simons' presence (correlated with higher totals) provide modest upward pull, while Spurs' formation and injury crisis provide downward pull. Central estimate: **10.0**.

**Corner spread (Liverpool − Tottenham) — central estimate: +4.0 (range +1 to +8)**

Liverpool's corner dominance over Spurs is well-established: +3.6 average margin across 5 H2H games. Today's conditions amplify that advantage — Anfield, superior squad depth, Spurs' defensive personnel crisis. The Dec 2025 H2H (Liverpool +4 corners) is the most relevant datapoint with reasonable personnel overlap on Liverpool's side.

#### Reconciliation

**Contradiction 1: Liverpool home total avg (11.0) vs Spurs away total avg (7.00 excl outlier).** Gap of 4.0. I trust Liverpool's home data more because as the home team they will dictate tempo and territory. Spurs' away totals are dragged down by games against defensive sides (Burnley 4, Crystal Palace 5) where the opponent also generated few corners. Liverpool at home are not a low-corner opponent — they attack aggressively. Resolution: lean toward Liverpool's home tendencies, adjusted down slightly for Spurs' suppressive presence → 10.0.

**Contradiction 2: Spurs' all-games corners-won avg (4.53) vs Liverpool's home conceded avg (3.17 excl Newcastle outlier).** Gap of 1.36 corners. Liverpool's home defensive record suggests Spurs will win fewer than their average. Spurs' away-specific won rate (4.00) is already lower than their all-games rate, and their recent declining trend (3.50 last 6 games, which includes home games) reinforces a lower figure. Resolution: I trust the Liverpool conceded rate and Spurs' recent trend → 3.0 corners for Spurs.

**Contradiction 3: Recent Liverpool total trend (13.0 last 6) vs historical home avg (11.0).** The recent surge includes several away games and may not fully apply at home. Liverpool's last 4 home PL games average 13.0 (including Newcastle 18 and West Ham 15), but removing those elevated games leaves Burnley 10 and Man City 9. Resolution: the recent trend provides a modest upward pull but is not strong enough to override the larger sample. I shade the estimate to 10.0 rather than below, but do not push to 11+.

### Phase 3 — Value Identification

#### Variance & Distribution Model

**Team-specific total-corner variance (venue-filtered):**
- Liverpool home PL: σ² = 20.0, μ = 11.0 (7 games)
- Tottenham away PL: σ² = 27.71, μ = 8.50 (8 games)
- Average variance: (20.0 + 27.71) / 2 = **23.86**

Predicted match total: μ = 10.0, σ² = 23.86.

Since variance (23.86) >> mean (10.0), the **Negative Binomial** distribution is appropriate.

**NegBin parameters:**
- r = μ² / (σ² − μ) = 100 / 13.86 = **7.22**
- p = r / (r + μ) = 7.22 / 17.22 = **0.419**

Verification: mean = r(1−p)/p = 7.22 × 0.581/0.419 = 10.0 ✓

#### Totals Markets

**Model probabilities (NegBin with μ=10.0, σ²=23.86, using normal approximation with σ=4.885 and right-skew adjustment):**

For each line, I compute two estimates and reconcile:

**Over 8.5:**

| Method | P(Over) |
|--------|---------|
| Empirical venue-filtered | (85.7% + 37.5%) / 2 = 61.6% |
| Empirical all-games | (83.3% + 42.1%) / 2 = 62.7% |
| NegBin model | ~58% |
| **Reconciled** | **61%** |

The model and empirical estimates agree within 4pp. I weight the empirical slightly higher due to the model's sensitivity to variance estimates.

Implied probability: FD Over 1.30 = 76.9%; DK Over 1.26 = 79.4%.
FD Under 3.30 = 30.3%; DK Under 3.50 = 28.6%.

Under 8.5 edge: my P(Under) = 39% vs DK implied 28.6% = **10.4pp raw edge.** However, Liverpool at home rarely produce ≤8 total corners (1 of 7 = 14.3%). The 39% figure is inflated by averaging with Spurs' 62.5% under rate. Since Liverpool dictate play at Anfield, the true probability is likely closer to 28–32%. **Insufficient edge after adjustment — no bet.**

**Over 9.5:**

| Method | P(Over) |
|--------|---------|
| Empirical venue-filtered | (71.4% + 37.5%) / 2 = 54.5% |
| Empirical all-games | (61.1% + 36.8%) / 2 = 49.0% |
| NegBin model | ~49% |
| **Reconciled** | **51%** |

Venue-filtered and all-games disagree by 5.5pp. The all-games sample is 2.5× larger, so I lean toward it, adjusted slightly up for Liverpool's home propensity.

FD Under 9.5 at 2.36: implied 42.4%. My P(Under) = 49%. Edge = **6.6pp.**
DK Under 9.5 at 2.55: implied 39.2%. My P(Under) = 49%. Edge = **9.8pp.**
EV at DK: 0.49 × 2.55 − 1 = +24.95%.

**Over 10.5:**

| Method | P(Over) |
|--------|---------|
| Empirical venue-filtered | (42.9% + 25.0%) / 2 = 34.0% |
| Empirical all-games | (50.0% + 31.6%) / 2 = 40.8% |
| NegBin model | ~41% |
| **Reconciled** | **38%** |

I shade toward venue-filtered because this match's conditions (Liverpool at Anfield vs low-corner away side) are better captured by venue-specific data. Spurs' 25% over rate at away grounds is the key anchor — only 2 of 8 away PL games exceeded 10.5 total, and one was the Newcastle outlier.

FD Under 10.5 at 1.86: implied 53.8%. My P(Under) = 62%. Edge = **8.2pp.**
DK Under 10.5 at 1.95: implied 51.3%. My P(Under) = 62%. Edge = **10.7pp.**
EV at DK: 0.62 × 1.95 − 1 = +20.9%.

**Over 11.5:**

| Method | P(Over) |
|--------|---------|
| Empirical venue-filtered | (28.6% + 25.0%) / 2 = 26.8% |
| Empirical all-games | (33.3% + 26.3%) / 2 = 29.8% |
| NegBin model | ~34% |
| **Reconciled** | **28%** |

The model's higher estimate reflects symmetric dispersion; the empirical data shows a right-skewed deficit at this level — games either stay below 11 or jump well above. I lean toward the empirical.

FD Under 11.5 at 1.55: implied 64.5%. My P(Under) = 72%. Edge = **7.5pp.**
DK Under 11.5 at 1.61: implied 62.1%. My P(Under) = 72%. Edge = **9.9pp.**
EV at DK: 0.72 × 1.61 − 1 = +15.9%.

**Over 12.5:**

Reconciled P(Over) = 22%. FD Under 1.32 (implied 75.8%): edge = 2.2pp. DK Under 1.37 (implied 73.0%): edge = 5.0pp. Borderline at DK — monitoring only.

**Over 13.5–15.5:** All under estimates exceed 80%. Implied probabilities for unders range 84.7–94.3%. Edges are <5%. No value.

#### Spreads Market

**DK Liverpool −3.5 at 1.83 / Tottenham +3.5 at 1.87:**

Using Skellam approximation (difference of independent variables):
- Mean difference: 7.0 − 3.0 = +4.0
- Variance of difference: Var(Liv won) + Var(Spurs won) = 12.84 + 9.44 = 22.28
- SD = √22.28 = 4.72
- P(Liverpool −3.5 covers) = P(D > 3.5) = P(Z > (3.5 − 4.0)/4.72) = P(Z > −0.106) ≈ **54.2%**

DK Liverpool −3.5 implied: 1/1.83 = 54.6%. Edge = 54.2% − 54.6% = **−0.4pp.** No value.
DK Tottenham +3.5 implied: 1/1.87 = 53.5%. My P(D ≤ 3.5) = 45.8%. Negative edge.

The spread is fairly priced. No actionable divergence.

#### Cross-checks

**Book's implied team corners:**
- FD's balanced 10.5 line (1.86/1.86) implies center at 10.5. With the −3.5 spread: Liverpool implied = (10.5 + 3.5)/2 = **7.0**, Tottenham implied = (10.5 − 3.5)/2 = **3.5**.
- My estimates: Liverpool 7.0 (matches), Tottenham 3.0 (0.5 lower than book).
- The 0.5-corner divergence on Tottenham drives my total being 10.0 vs the book's ~10.5.

**DK vs FD divergence:** DK's Under prices are consistently higher than FD's across all lines. At 9.5: FD Under 2.36 vs DK Under 2.55 — a difference of 8% in odds, corresponding to >3pp difference in implied probability (42.4% vs 39.2%). DK is systematically more generous on Unders. The largest implied probability difference between books is at Over 9.5: FD 64.9% vs DK 69.0% = **4.1pp** — below the 10% flag threshold. No bookmaker divergences exceed 10% on the same line.

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|-----------|
| 1 | Under 10.5 Total Corners | DK | 1.95 | 62% | 51.3% | +10.7pp | High |
| 2 | Under 11.5 Total Corners | DK | 1.61 | 72% | 62.1% | +9.9pp | High |
| 3 | Under 9.5 Total Corners | DK | 2.55 | 49% | 39.2% | +9.8pp | Medium |

**Pick 1 — Under 10.5 Total Corners at DraftKings 1.95.** Tottenham have exceeded 10.5 total corners in only 2 of 8 away PL games (25%), and both required exceptional circumstances (Newcastle's 40-cross onslaught, and an open Fulham game). Liverpool's home PL games against comparable deep-sitting opponents cluster at 10–11 total (Burnley 10, Leeds 11, Wolves 10). With Spurs likely deploying a conservative back-3 under Tudor's crisis-management approach and missing their entire first-choice CB pair plus primary DM, the conditions for sustained attacking from the visitors are poor. The book prices this as essentially a coin-flip (51.3% implied), but the data strongly favours the Under. Primary risk: Liverpool score early and Spurs are forced to chase, generating an open game.

**Pick 2 — Under 11.5 Total Corners at DraftKings 1.61.** This is the safer cousin of Pick 1. Only 2 of 7 Liverpool home PL games (28.6%) and 2 of 8 Spurs away PL games (25%) exceeded 11.5 total. The empirical rate (avg 26.8%) substantially undercuts the book's implied 62.1%. Even accounting for Liverpool's recent elevated trend, a game needing 12+ corners requires either sustained two-way attacking (unlikely given Spurs' depleted squad) or an extreme one-sided bombardment (possible but rare — only the Newcastle H game reached this level in Liverpool's home sample). DK's 1.61 provides enough value at a high-probability outcome. Primary risk: same open-game scenario as Pick 1, or Liverpool generating double-digit corners alone through relentless pressure.

**Pick 3 — Under 9.5 Total Corners at DraftKings 2.55.** The most aggressive pick. Spurs' away PL games go under 9.5 in 62.5% of cases (5 of 8). Liverpool's home PL games go under 9.5 in only 28.6% (2 of 7). The blended rate of approximately 49% is materially higher than DK's implied 39.2%, creating near-10pp edge at attractive 2.55 odds (+25% EV). The case rests on Spurs' suppressive effect on match totals — their back-3 formation games average just 6.67 total corners, and their limited personnel should constrain the game's attacking intensity. At 2.55 odds, you only need to win 39.2% of the time to break even, and the data suggests you win ~49%. Primary risk: this is essentially a coin-flip on probability — the edge comes from price, not from overwhelming probability. Higher variance than Picks 1–2.

---

## Bets to Avoid

**Over 10.5 Total Corners (either book).** The temptation is clear — Liverpool at home, dominant side, should force the issue. But the market prices Over 10.5 at essentially 50% (FD 1.86/1.86). Liverpool's home propensity alone (42.9% of PL games over 10.5) doesn't justify this, and Spurs' away record (25% over 10.5) is a significant drag. The book appears to be anchoring on Liverpool's attacking reputation rather than on the low-corner reality of Spurs' away games.

**Liverpool −3.5 Corners Spread at DK 1.83.** The line aligns almost exactly with my predicted spread of −4.0. At 54.6% implied vs my 54.2% estimated probability, there is no edge. While Liverpool should dominate corners, the high variance of the difference (SD = 4.72) means this is essentially a coin-flip at the posted price.

---

## Caveats

1. **Small venue-filtered samples.** Liverpool's home PL analysis draws on only 7 games; Tottenham's away PL on 8. Threshold frequency rates based on such samples have wide confidence intervals — a single additional game could shift rates by 10–14pp.

2. **Spurs' Newcastle outlier.** Tottenham's away statistics are heavily influenced by the Newcastle game (19 total corners, 2.35σ above mean). With it, their away total mean is 8.50; without, 7.00. All value calculations depend partly on whether this game is representative or anomalous. I treat it as anomalous (unique opponent profile with 40 crosses), which strengthens the Under case — but if it reflects a genuine tail-risk in Spurs' variance, the Under edge narrows.

3. **Liverpool rotation risk.** The UCL second leg vs Galatasaray three days later could prompt Slot to manage minutes. If key attackers (Salah, Gakpo) are substituted early, second-half corner generation may decline — this would help the Under case but introduces unpredictable timing effects.

4. **Tottenham's crisis-driven unpredictability.** Tudor has used four different formations in four games. With 13 players absent, tactical predictability is low. If Spurs abandon their likely conservative approach and press high (desperation mode), game totals could be significantly elevated. This is the primary risk to all three Under picks.

5. **Model assumptions.** The Negative Binomial model assumes independence between teams' corner outputs. In practice, open games inflate both teams' corners simultaneously. If Liverpool score early and the game opens up, the positive correlation between teams' corners would push the total higher than the model predicts.

6. **Variance dominates.** Liverpool's home total SD is 4.47; Spurs' away SD is 5.26. With such high variance, any single-game outcome can deviate sharply from the mean. The value proposition is sound over a series of bets at these prices, but any individual match can produce a result anywhere in the 4–19 range that these teams have shown.