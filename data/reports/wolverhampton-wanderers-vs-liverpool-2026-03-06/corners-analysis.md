Now I have all the context I need. Let me compile the full analysis.

---

# Wolverhampton Wanderers vs Liverpool — FA Cup 5th Round
**Friday 6 March 2026, 8pm GMT | Molineux**

---

## Statistical Summary

| Metric | Wolves (Home) | Liverpool (Away) |
|--------|---------------|-------------------|
| Venue-filtered avg corners won | 2.80 (n=10) | 6.63 (n=8 PL away) |
| Venue-filtered avg corners conceded | 6.50 (n=10) | 3.50 (n=8 PL away) |
| All-games avg corners won | 3.17 (n=18) | 6.72 (n=18) |
| All-games avg corners conceded | 6.39 (n=18) | 4.00 (n=18) |
| H2H avg corners (Molineux) | 2.00 (n=2) | 10.50 (n=2) |
| H2H avg corners (all) | 2.75 (n=4) | 7.75 (n=4) |
| H2H avg total | 10.50 (all), 12.50 (Molineux) | — |
| League avg total | ~9.84 | — |

**Predicted total**: 10–14 (central **12.0**)
**Predicted spread**: Liverpool −6.0 to −8.0 (central **Liverpool −7.0**)

---

## Detailed Analysis

### Phase 1 — Statistical Analysis

#### 1A. Data Cleaning

**Wolves**: 20 games listed. Two FA Cup games (Grimsby Town away, Shrewsbury Town home) have missing corner data ("-"). **18 valid games remain.** All 18 are Premier League, same-league opponents — no cross-competition comparability concerns.

**Liverpool**: 20 games listed. Two FA Cup games (Brighton home, Barnsley home) have missing corner data. **18 valid games remain.** Of these, three are Champions League (Qarabag home, Marseille away, Inter away). These are non-PL opponents and flagged accordingly. PL-only valid games: 15.

#### 1B. Wolves (Home) — Corner Stats

**Home subset (n=10)**:

| Metric | Won | Conceded | Total |
|--------|-----|----------|-------|
| Mean | 2.80 | 6.50 | 9.30 |
| Median | 3.00 | 6.50 | 10.50 |
| Range | 0–6 | 3–11 | 4–13 |
| Variance (sample) | 3.51 | 6.72 | 10.90 |
| SD | 1.87 | 2.59 | 3.30 |

**All-games baseline (n=18)**:

| Metric | Won | Conceded | Total |
|--------|-----|----------|-------|
| Mean | 3.17 | 6.39 | 9.56 |
| Median | 3.00 | 7.00 | 10.00 |
| Variance | 4.03 | 5.55 | 6.38 |
| SD | 2.01 | 2.36 | 2.53 |

**Venue vs overall delta**: Home corners won is 0.37 lower than all-games (2.80 vs 3.17), driven by Wolves sitting deeper at home in a back-3/5 against stronger opposition. Home total (9.30) is slightly below all-games (9.56). The difference is small but consistent with a team that concedes territory at home.

**Trend — last 6 home games**: Liverpool (2w), Villa (0w), Arsenal (1w), Chelsea (3w), Bournemouth (5w), Newcastle (4w) → mean won = 2.50. Older 4 home: West Ham (6w), Brentford (3w), Man Utd (1w), Nott Forest (3w) → mean won = 3.25. Recent home trend is marginally lower, though the presence of both Liverpool and Arsenal among the recent games (two of the league's most dominant territorial teams) explains this. The 6w against West Ham (older set) was a 3-0 home win where Wolves were dominant — unlikely to be repeated against Liverpool.

**Threshold frequencies (home)**:

| Line | Over (home) | Over (all) |
|------|-------------|------------|
| >8.5 | 6/10 = 60% | 13/18 = 72.2% |
| >9.5 | 6/10 = 60% | 12/18 = 66.7% |
| >10.5 | 5/10 = 50% | 6/18 = 33.3% |
| >11.5 | 3/10 = 30% | 4/18 = 22.2% |
| >12.5 | 2/10 = 20% | 2/18 = 11.1% |

Note the sharp drop-off at 10.5 in all-games — Wolves' games cluster heavily around 10 (six games hit exactly 10). Home games show higher frequency over 10.5 (50%) because the opponents at Molineux tend to be more attacking (Liverpool, Newcastle, West Ham, etc.).

#### 1C. Liverpool (Away) — Corner Stats

**Away PL subset (n=8)** — excluding CL games:

| Metric | Won | Conceded | Total |
|--------|-----|----------|-------|
| Mean | 6.63 | 3.50 | 10.13 |
| Median | 7.00 | 3.00 | 10.00 |
| Range | 0–11 | 2–7 | 3–14 |
| Variance | 18.84 | 2.86 | 13.84 |
| SD | 4.34 | 1.69 | 3.72 |

**All-games PL baseline (n=15)**:

| Metric | Won | Conceded | Total |
|--------|-----|----------|-------|
| Mean | 6.67 | 3.87 | 10.53 |
| Median | 7.00 | 3.00 | 10.00 |
| Variance | 12.52 | 6.55 | 12.41 |
| SD | 3.54 | 2.56 | 3.52 |

**Including CL games (all 18)**: Won 6.72, Conceded 4.00, Total 10.72. CL games pull the average marginally due to the Qarabag outlier (14w).

**Venue vs overall delta**: Away won (6.63) is close to all-games (6.67) — Liverpool produce similar corner volumes regardless of venue. Away total (10.13) is slightly below all-games (10.53), mainly due to the 3-corner Arsenal away game dragging it down.

**Trend — last 4 away PL games**: Wolves 11w, Nott Forest 2w, Sunderland 11w, Bournemouth 11w → mean won = 8.75, totals = 13, 9, 14, 14 → mean total = 12.50. Older 4 away PL: Arsenal 0w, Fulham 8w, Tottenham 6w, Leeds 4w → mean won = 4.50, totals = 3, 11, 8, 9 → mean total = 7.75. This is a dramatic upswing in recent form. Three of the last four away games produced 11 Liverpool corners — this reflects Liverpool's territorial dominance against lower-half sides (Wolves, Sunderland, Bournemouth). The 2-corner game at Forest is the exception, against a top-4 team that pressed high. The trend has a clear causal explanation: Liverpool dominate territory against weaker sides and pump in crosses.

**Threshold frequencies (away PL)**:

| Line | Over (away PL) | Over (all PL) |
|------|----------------|----------------|
| >8.5 | 6/8 = 75.0% | 12/15 = 80.0% |
| >9.5 | 4/8 = 50.0% | 9/15 = 60.0% |
| >10.5 | 4/8 = 50.0% | 7/15 = 46.7% |
| >11.5 | 3/8 = 37.5% | 5/15 = 33.3% |
| >12.5 | 3/8 = 37.5% | 4/15 = 26.7% |

Liverpool's away games are heavily bimodal — huge corner counts against weaker teams, low against top sides. Wolves fall squarely in the "weaker" bracket.

#### 1D. Outlier Check

Combined pool of all 36 valid games: mean = 10.14, SD = 3.22. 2σ threshold: 16.58 upper, 3.70 lower.

**Flagged outliers**:
- **Liverpool vs Newcastle (H): 18 total** — 7w, 11c. Liverpool won 4-1 but conceded 11 corners from Newcastle's aggressive approach. This is a genuine outlier driven by Newcastle's unusually high crossing volume (25 crosses). Liverpool's home conceded average with/without: 4.29 with, 3.17 without.
- **Liverpool vs Arsenal (A): 3 total** — 0w, 3c. A 0-0 stalemate where both teams were extremely conservative; Liverpool managed 0 crosses into the box that led to corners. Liverpool's away average with/without: 10.13 with, 11.14 without.

**Wolves**: No single game exceeds 2σ. The two 13-total games (Liverpool, West Ham at home) are within bounds.

#### 1E. Head-to-Head

**Same venue (Molineux, n=2)**:

| Date | Wolves | Liverpool | Total | Age |
|------|--------|-----------|-------|-----|
| 2026-03-03 | 2 | 11 | 13 | 3 days |
| 2024-09-28 | 2 | 10 | 12 | 17 months |

Averages: Wolves 2.0, Liverpool 10.5, Total 12.5.

**All H2H (n=4)**:

| Date | Wolves | Liverpool | Total | Venue |
|------|--------|-----------|-------|-------|
| 2026-03-03 | 2 | 11 | 13 | Molineux |
| 2025-12-27 | 4 | 6 | 10 | Anfield |
| 2025-02-16 | 3 | 4 | 7 | Anfield |
| 2024-09-28 | 2 | 10 | 12 | Molineux |

Averages: Wolves 2.75, Liverpool 7.75, Total 10.50.

**Corner-count winner**: Liverpool won the corner count in all four H2H meetings (11-2, 6-4, 4-3, 10-2). Dominant pattern.

**Personnel continuity**:
- **2026-03-03** (3 days ago): Wolves XI overlap with expected XI is very high (~7-8/11 — Armstrong, Mané, André, Tchatchoua, Bueno, Sá all likely to feature again; Doherty may drop for Mosquera). Liverpool overlap is also high (~7-8/11 — van Dijk, Konaté, Salah, Szoboszlai, Ekitike likely to continue; rotation expected at LB, RB, one CM spot). **Full-weight signal.**
- **2025-12-27** (2.5 months ago): Good overlap for both sides. Moderate weight.
- **2025-02-16** (>12 months ago): Liverpool had Trent Alexander-Arnold, Diogo Jota, Luis Díaz — none are in the current squad. Wolves had Matheus Cunha, Nélson Semedo, Pablo Sarabia — all departed. **Heavily discounted.**
- **2024-09-28** (17 months ago): Even less overlap. Wolves played a 4-1-4-1 with Mario Lemina and Matheus Cunha. **Heavily discounted.**

The two relevant H2H games (2026-03-03 and 2025-12-27) average: Wolves 3.0, Liverpool 8.5, Total 11.5. The Molineux-specific game from 3 days ago is the strongest signal.

#### 1F. Lineup, Substitution & Formation

**Wolves — Player-corner correlations** (selected notable):

Wolves' corner-won output is universally low. The key differentiators are on the conceded side (i.e., which opponents they face), so I focus on total match corners:

| Player | Games In | Avg Total In | Avg Total Out | Notes |
|--------|----------|-------------|--------------|-------|
| Hwang Hee-Chan | 8 | 9.88 | 9.30 | Departing squad; higher totals when in may reflect open-game scorelines |
| Jhon Arias | 5 | 10.80 | 9.00 | Attacking wide player; correlates with slightly higher totals |
| Jørgen Strand Larsen | 6 | 10.17 | 9.17 | Started in older block only; no longer featuring regularly |
| Adam Armstrong | 7 | 9.14 | 9.91 | Recent addition; slightly lower totals when starting |

Armstrong started the most recent 5 games including the 13-total Liverpool match and the 5-total Villa match. His average total (9.14) is marginally lower, but sample is small and the Aston Villa game (5 total, 0 Wolves corners) significantly depresses this. Without that outlier: 9.83 — essentially identical to baseline.

**Wolves — Formation correlation**:

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 3-5-2 | 8 | 4.38 | 5.75 | 10.13 |
| 3-4-2-1 | 4 | 1.25 | 6.50 | 7.75 |
| 3-5-1-1 | 1 | 2.00 | 11.00 | 13.00 |
| 3-4-3 | 2 | 3.00 | 8.00 | 11.00 |
| 3-4-1-2 | 1 | 2.00 | 8.00 | 10.00 |
| 4-2-3-1 | 1 | 3.00 | 4.00 | 7.00 |

The 3-4-2-1 produces the lowest corners won (1.25 avg) — this is Wolves' most defensive shape with an isolated striker and narrow wingers. In the 2026-03-03 game they used an ultra-defensive 3-5-1-1 that yielded just 2 corners won but 11 conceded. For this FA Cup tie, with Wolves on a confidence high and potentially targeting a cup run, they may set up more positively. The 3-5-2 (their most common shape) produces higher team corner counts (4.38 won). Expected formation for this match is likely 3-5-2 or 3-4-2-1.

**Liverpool — Player-corner correlations** (PL only):

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|----------|-----------|------------|-------------|--------------|
| Florian Wirtz | 9 | 6.44 | 6.83 | 10.22 | 10.83 |
| Cody Gakpo | 11 | 7.27 | 5.50 | 10.82 | 10.00 |
| Curtis Jones | 9 | 5.56 | 7.83 | 9.78 | 11.33 |
| Hugo Ekitike | 12 | 7.42 | 5.00 | 11.17 | 9.33 |
| Jeremie Frimpong | 8 | 6.13 | 7.29 | 10.25 | 10.86 |

Ekitike's presence correlates with higher Liverpool corners won (7.42 vs 5.00 without) and higher totals (11.17 vs 9.33). He started the most recent game vs Wolves where Liverpool won 11. Curtis Jones in the XI correlates with *lower* Liverpool corners won (5.56 vs 7.83) — this may reflect Jones replacing an attacker (Wirtz or Gakpo), producing a less attack-heavy lineup. Jones is tipped to start this FA Cup match per predictions.

**Wirtz absence impact**: Wirtz has been out for the last 3 PL games (Wolves, West Ham, Forest). Liverpool's corners won in those: 11, 10, 2 → mean 7.67. In his 9 PL starts: mean 6.44. Totals without Wirtz: 13, 15, 9 → mean 12.33 vs 10.22 with him. This suggests Liverpool's corner output hasn't suffered without Wirtz — potentially because his replacement (often Gakpo or Ngumoha) puts in more crosses than Wirtz's direct dribbling style. However, this is a tiny sample.

**Liverpool — early attacking subs**: In the Wolves PL game (03-03), Gravenberch came off injured at 22' and Jones replaced him — 13 total corners. In the Bournemouth away game, Gomez off at 34' and Kerkez at 45' — 14 total corners. These forced changes created more open games. No clear systematic pattern.

**Wolves — early exits**: In the West Ham home game, Hwang off at 4' (injury) and Mané at 41' — 13 total. Against Chelsea, Hwang off at 43' and Doherty at 45' — 7 total. Mixed signal.

#### 1G. Absence Impact

**Liverpool confirmed absentees**: Alexander Isak (fractured fibula), Wataru Endo (season-ending ankle surgery), Conor Bradley (unspecified), Giovanni Leoni (ACL). Florian Wirtz trained partially and is a doubt — predicted to be available from the bench only.

- **Isak**: Has not featured in recent sample (injured since December). All analysed games are without him. No comparative impact.
- **Wirtz**: 9 starts in PL sample. Liverpool's PL away corners won with Wirtz: he started 4 of 8 away PL games (Bournemouth 11, Arsenal 0, Tottenham 6, Leeds 4) → mean 5.25. Without: 11 (Wolves), 2 (Forest), 11 (Sunderland), 8 (Fulham) → mean 8.00. Counterintuitively, Liverpool win more away corners without Wirtz. Small sample, but the direction suggests replacing Wirtz with a wider/crosser type (Gakpo shifts, Ngumoha comes in) increases corner generation. This is a positive factor for corner totals.
- **Bradley**: Has barely featured recently. No material impact.

**Wolves**: No fresh injury concerns per search results. Hwang Hee-Chan returns to the squad, Krejčí has served his one-match ban from the Crystal Palace red card. Wolves have essentially a full squad minus long-term absences.

#### 1H. Contextual Factors

**League baseline**: PL 2025/26 averages ~9.84 total corners per game. Both teams' all-games averages are close to or above this (Wolves 9.56, Liverpool 10.53 PL-only).

**League positions & motivation**:
- **Wolves**: Dead last, 30 GP, 3W-7D-20L, 16 points, GD -30. Relegation is near-certain. However, they just won back-to-back games for the first time since April (Villa 2-0, Liverpool 2-1). Rob Edwards described the FA Cup as a route to "redemption" and Wolves targeted their deepest run since 2018/19 semis. **High motivation for this cup tie.**
- **Liverpool**: 5th place, 29 GP, 48 points. Chasing top-4 for Champions League qualification. Lost the PL game to Wolves 3 days ago — Van Dijk called the team "slow, predictable, and sloppy." Slot vowed a "strong lineup." However, they have a CL last-16 first leg vs Galatasaray next week, meaning some rotation is inevitable. **Moderate-to-high motivation; rotation risk is real.**

**Score-state analysis**: In Wolves home games with high corner totals, score-state often played a role:
- vs Liverpool (13 total): 0-0 at HT, Wolves scored late (78'), equalized (83'), winner (90'+4'). Liverpool dominated possession (66%) and piled up corners while level.
- vs West Ham (13 total): 3-0 at HT, West Ham chased the game in the second half, corners accumulated on both sides.
- vs Newcastle (11 total): 0-0 throughout, sustained pressure from both sides.

The key finding: high corner counts at Molineux occur when Wolves sit deep and the opponent dominates territory (Liverpool, Newcastle), or when Wolves are ahead and the opponent pushes forward (West Ham). In this FA Cup tie, Liverpool are overwhelming favourites — the game is likely to follow the Liverpool pattern of sustained attacking pressure against a deep Wolves block.

**Tactical context**: The 2026-03-03 meeting saw Wolves in a 3-5-1-1 with PPDA of 22.4 (extremely passive pressing) vs Liverpool's PPDA of 7.1 (aggressive press). Liverpool had 27 crosses to Wolves' 9, 10 deep completions to Wolves' 1. Wolves managed just 4 shots to Liverpool's 19. This territorial imbalance directly explains the 11-2 corner split. Even though Wolves won the game through counter-attacking efficiency, the corner profile should remain similar: Liverpool will dominate territory and generate the vast majority of corners.

For the FA Cup match, Liverpool may rotate some personnel (Gomez for Frimpong, Robertson for Kerkez, Jones for Mac Allister, possibly Mamardashvili for Alisson). This rotation should have minimal impact on territorial dominance — Liverpool's B-team calibre players still vastly outclass Wolves. Robertson is an attacking LB who delivers more crosses than Kerkez. Ngumoha's potential inclusion adds pace on the wing.

---

### Phase 2 — Predicted Distribution

#### Wolves Corners Won

**Primary inputs**:
- Home mean: 2.80 (n=10). Recent 6 home games: 2.50.
- All-games mean: 3.17 (n=18).
- H2H at Molineux: 2.0 (n=2, including the 3-day-old game).
- The 2026-03-03 game is the single most relevant data point: Wolves won 2 corners in a match where they had just 9 crosses and 34% possession. The FA Cup fixture is at the same venue, against the same opponent, with near-identical personnel, 3 days later.

**Secondary context**: Liverpool concede 3.50 corners per away PL game. Without the Newcastle outlier (11 conceded, genuinely exceptional), this drops to 2.86. Liverpool's low conceded rate reflects their dominant possession style — opponents simply don't attack enough to generate corners. This reinforces, rather than contradicts, the low Wolves estimate.

**Adjustment factors**: Wolves may set up slightly more positively in a cup game (3-5-2 rather than 3-5-1-1). The 3-5-2 correlates with 4.38 corners won on average. However, against Liverpool specifically, even more positive Wolves setups produced only 4 corners (Anfield, Dec 27 in a 3-4-2-1). I give this a marginal upward nudge (+0.5).

Wolves may also be riding confidence from back-to-back wins. This could encourage slightly more adventurous play, though their fundamental quality gap remains enormous (xG of 0.64 vs Liverpool's 2.17 in the most recent meeting).

**Central estimate: 2.5** (range 1–4).

#### Liverpool Corners Won

**Primary inputs**:
- Away PL mean: 6.63 (n=8). Recent 4 away: 8.75.
- All-games PL mean: 6.67 (n=15).
- H2H at Molineux: 10.5 (n=2). The 3-day-old game: 11 corners won.
- Against lower-half away sides specifically: Wolves 11, Sunderland 11, Bournemouth 11, Fulham 8 → mean 10.25.

**Secondary context**: Wolves concede 6.50 corners at home (n=10). This rate includes games against all opponents, some of whom are far less dominant than Liverpool. Against the two most attacking visitors (Liverpool 11, Newcastle 7), average conceded is 9.0.

**Adjustment factors**:
- **Rotation**: Predicted Liverpool XI includes Gomez (RB), Robertson (LB), Jones (CM) instead of Frimpong, Kerkez, Mac Allister. Robertson is historically an excellent crosser — potentially more corner-generating than Kerkez. Gomez is less attacking than Frimpong but competent. Jones for Mac Allister is a slight downgrade in progression but Jones is a decent ball-carrier. Net impact on corners: roughly neutral, possibly marginally negative (−0.5). Ngumoha's potential start adds counter-attacking width that could generate corners through blocks and deflections.
- **Wirtz absence**: As noted in 1G, Liverpool have actually won *more* away corners without Wirtz (mean 8.00 vs 5.25 with). Though this is a small sample, the directional signal is that Wirtz's replacement(s) generate more crossing volume.
- **Cup game dynamics**: FA Cup games can feature more open play, especially when the favourite dominates. No extra time corner incentive but the single-leg nature may encourage Wolves to attack more, creating more transition opportunities for Liverpool.
- **Recency**: Three 11-corner away games in the last four (including vs this exact opponent) weigh heavily. The one exception (2 at Forest) was against a top-4 team that pressed high and limited Liverpool's crossing — not applicable to Wolves.

The H2H signal at Molineux (11, 10) is extraordinarily strong but based on just 2 games. The older game (Sep 2024) had limited personnel overlap and is discounted. The recent game (3 days ago) has maximum relevance. Liverpool's territorial dominance against weak sides is a repeatable structural pattern backed by xG models (Liverpool's oppDeep of 1 vs their Deep of 10 in the last meeting).

I temper the estimate somewhat below the 11-corner recent H2H figure because: (a) rotation slightly weakens Liverpool's attack, (b) Wolves may adjust tactically having won the PL game, and (c) the 11-corner figure is at the high end of even Liverpool's impressive away output.

**Central estimate: 9.0** (range 6–12).

#### Total Match Corners

Per-team sum: 2.5 + 9.0 = **11.5**. However, the H2H data at Molineux (13, 12 → avg 12.5) and Liverpool's recent away totals vs weak sides (13, 14, 14 → avg 13.7) pull higher. The league average for matches involving Liverpool (PL-only) is 10.53, above the 9.84 PL baseline.

I set the central estimate at **12.0**, slightly above the per-team sum, reflecting:
- The specific matchup propensity (Wolves sit deep → Liverpool rack up corners → high totals).
- The 2026-03-03 reference game: 13 total, with Wolves scoring late goals that reduced the time Liverpool could generate corners in the final 15 minutes.
- Rotation marginally dampening Liverpool's output.

**Central estimate: 12.0** (range 9–15).

#### Corner Spread (Wolves − Liverpool)

Per-team estimates: 2.5 − 9.0 = **−6.5**.

H2H Molineux: −9, −8 → mean −8.5. These are extreme values. The broader H2H: −9, −2, −1, −8 → mean −5.0 but heavily skewed by venue (Anfield games are tighter).

**Central estimate: −7.0** (range −4 to −10). Liverpool favoured to win the corner count by approximately 7.

### Reconciliation — Material Contradictions

**Contradiction 1**: Wolves' all-games corners-won average (3.17) implies they could win 3+ corners, but the Molineux H2H (2.0 avg) and Liverpool's away conceded rate (3.50, or 2.86 ex-Newcastle) suggest 2–3. **Resolution**: Against Liverpool specifically, Wolves are suppressed below their baseline because Liverpool's press limits Wolves' attacking opportunities. The H2H signal is more informative than the all-games average. I trust the lower estimate (2.5).

**Contradiction 2**: Liverpool's away PL total average (10.13) is well below the Molineux-specific H2H total (12.5). **Resolution**: Liverpool's overall away average is dragged down by games against strong teams (Arsenal 3, Tottenham 8, Forest 9). Against lower-half sides, totals are consistently higher (13, 14, 14, 11). Wolves are bottom of the table. I trust the matchup-specific higher figure and lean towards 12.0.

**Contradiction 3**: Wolves' home total average (9.30) is below my predicted 12.0. **Resolution**: The 9.30 includes games against mid-table sides that produce fewer corners (Villa 5, Arsenal 4, Chelsea 7, Brentford 7). Against attacking visitors who dominate territory (Liverpool 13, West Ham 13, Newcastle 11), home totals average 12.33. Liverpool fit the "attacking dominant visitor" profile precisely.

**No unresolved contradictions remain.**

---

### Phase 3 — Value Identification

#### Variance & Distribution Model

**Wolves home total variance**: 10.90 (mean 9.30) → Variance > Mean → **Negative Binomial**.
**Liverpool away PL total variance**: 13.84 (mean 10.13) → Variance > Mean → **Negative Binomial**.

Average of two variances: (10.90 + 13.84) / 2 = **12.37**.

For the predicted total of μ = 12.0 and σ² = 12.37:
- r = μ² / (σ² − μ) = 144 / 0.37 = 389.2
- p = μ / σ² = 12.0 / 12.37 = 0.970

This is nearly Poisson (variance ≈ mean), so r is very large. In practice, this means a Poisson distribution with λ = 12.0 is a reasonable approximation.

**However**, I note that the true matchup variance is likely higher than this arithmetic average suggests, given Liverpool's bimodal away pattern and the high SD of Wolves' home totals (3.30). A more conservative estimate would use σ² ≈ 10–13, keeping us in NegBin territory with a moderate overdispersion. For practical purposes, I will use Poisson (λ = 12.0) as the primary model, with NegBin sensitivity checks.

#### No Odds Available

**The report states: "No corner markets open yet."**

Without bookmaker lines, I cannot compute implied probabilities, edges, or value picks. However, I provide model probabilities for common lines so that the reader can compare when markets open:

**Totals — Poisson (λ = 12.0) model probabilities**:

| Line | P(Over) Model | Empirical (avg of team rates) |
|------|--------------|-------------------------------|
| >8.5 | 88.4% | (60% + 75%) / 2 = 67.5% |
| >9.5 | 81.5% | (60% + 50%) / 2 = 55.0% |
| >10.5 | 72.1% | (50% + 50%) / 2 = 50.0% |
| >11.5 | 60.6% | (30% + 37.5%) / 2 = 33.8% |
| >12.5 | 47.4% | (20% + 37.5%) / 2 = 28.8% |

The model gives materially higher probabilities than the raw empirical rates. This is because the empirical rates include games against all opponents, while the model is calibrated to this specific matchup (Liverpool dominating bottom-of-table Wolves at Molineux). The truth likely sits between the two, leaning towards the model given the specificity of the H2H data. I would use:

| Line | Estimated True P(Over) |
|------|----------------------|
| >8.5 | ~83% |
| >9.5 | ~73% |
| >10.5 | ~63% |
| >11.5 | ~52% |
| >12.5 | ~40% |

**Spreads — Skellam model** (difference of independent Poissons, Liverpool λ₁ = 9.0, Wolves λ₂ = 2.5):

| Line (Liverpool handicap) | P(Liverpool covers) |
|---------------------------|-------------------|
| Liverpool −5.5 | ~58% |
| Liverpool −6.5 | ~49% |
| Liverpool −7.5 | ~39% |
| Liverpool −8.5 | ~29% |

Liverpool's corner-count dominance is extreme. The spread market should centre around −6.5 to −7.5.

---

### Phase 4 — Output

#### Value Picks

**No picks can be made — corner markets are not yet open.** When markets open, the key areas to monitor for value:

1. **Over 10.5 total corners** — estimated ~63% true probability. If priced at 1.75+ (implied ≤57%), this would represent ≥6% edge.
2. **Over 11.5 total corners** — estimated ~52%. If priced at 2.10+ (implied ≤48%), this could offer edge.
3. **Liverpool −5.5 corner spread** — estimated ~58%. If priced at 1.85+ (implied ≤54%), value exists.
4. **Liverpool team corners over 7.5 or 8.5** — Liverpool have won 8+ corners in 4 of their last 5 away PL games (vs non-top-6 teams). P(>7.5) ≈ 72%, P(>8.5) ≈ 60%.

#### Bets to Avoid

1. **Under 9.5 total corners** — tempting given the PL average is ~9.84 and Wolves' all-games average is 9.56, but this matchup is structurally above-average due to Liverpool's territorial dominance. Under 9.5 hit in only 2/4 H2H games (both at Anfield where games were tighter). At Molineux, H2H totals were 13 and 12. No value on the under here.

2. **Wolves corners over 3.5 or 4.5** — Wolves averaged 2.80 at home and just 2.0 in H2H at Molineux. Their inability to build attacks against Liverpool's press (9 crosses, 1 deep completion in the last meeting) makes high Wolves corners very unlikely. This is a trap if priced attractively.

#### Caveats

1. **FA Cup rotation**: Liverpool are expected to rotate 3-4 players. This is reflected in the estimates but adds uncertainty. If Slot unexpectedly names a significantly weakened XI (e.g., Mamardashvili, multiple youth players), Liverpool's corner generation would decrease materially.

2. **Small H2H sample**: The Molineux-specific H2H is just 2 games, with one from 17 months ago (discounted). The headline 12.5 avg total leans heavily on the single game from 3 days ago.

3. **Wolves' recent form**: Back-to-back wins have injected confidence. If Wolves set up more aggressively (3-5-2 rather than 3-5-1-1), this could create a more open game, potentially increasing corners for both sides — not decreasing them.

4. **Wirtz partial fitness**: Slot indicated Wirtz trained "half and half." If he starts unexpectedly, this would change Liverpool's attacking profile (fewer crosses, more direct dribbling), potentially *reducing* total corners by 1-2.

5. **Variance**: Liverpool's away corner variance (SD 4.34) is extremely high. The distribution is bimodal — dominant performances (11 corners × 3) interspersed with suppressed games (0, 2). Against Wolves, the dominant mode is far more likely, but the wide confidence interval (6–12 range) reflects genuine uncertainty.

6. **No odds available**: All probability estimates are academic until markets open. Edge calculations should be done fresh against actual lines.