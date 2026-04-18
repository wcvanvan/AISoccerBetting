I'll search for corner odds to complete the analysis, then write the full report.

I have corner odds from one source. Let me write the full analysis now.

## Statistical Summary

| Metric | Man City (Home) | Arsenal (Away) |
|--------|-----------------|----------------|
| Venue-filtered avg corners won | 5.33 (n=9) | 5.67 (n=9) |
| Venue-filtered avg corners conceded | 4.22 | 3.33 |
| All-games avg corners won | 6.45 (n=20) | 6.35 (n=20) |
| All-games avg corners conceded | 3.55 | 3.35 |
| H2H avg corners (matching venue) | 8.0 (n=1) | 2.0 (n=1) |
| H2H avg corners (all) | 3.5 | 5.25 |
| H2H avg total | 8.75 (n=4) | — |
| League avg total | ~10.0–10.5 | — |

**Predicted total**: 8.5–11.5 (central 10.0)
**Predicted spread (City − Arsenal)**: +1.0 (range −1 to +4)

---

## Detailed Analysis

### 1A. Data Cleaning

**Manchester City**: all 20 games have valid corner data. 0 excluded. 10 cup/European fixtures among the 20 — Real Madrid (UCL, comparable), Galatasaray (UCL, weaker), Bodø/Glimt (UCL, much weaker), Liverpool (FA Cup, comparable), Newcastle (FA Cup × 1, EFL Cup × 2, comparable), Salford City (FA Cup, non-league — flag as inflated).

**Arsenal**: all 20 games have valid corner data. 0 excluded. 10 cup/European fixtures — Sporting CP (UCL, comparable), Bayer Leverkusen (UCL, comparable), Kairat Almaty (UCL, much weaker), Southampton (FA Cup, lower PL), Mansfield Town (FA Cup, non-league — flag), Wigan Athletic (FA Cup, non-league — flag), Chelsea (EFL Cup, comparable), Manchester City (EFL Cup, comparable).

Both datasets include 3–4 games against significantly weaker opponents whose corner patterns may not reflect PL matchup quality.

---

### 1B. Manchester City (Home) — Corner Stats

**Home games (n=9)**: Liverpool FA Cup (6), Real Madrid UCL (15), Nott Forest PL (7), Newcastle PL (10), Salford FA Cup (13), Fulham PL (8), Newcastle EFL Cup (9), Galatasaray UCL (8), Wolves PL (10).

**Corners won**: 4, 9, 6, 5, 7, 4, 5, 4, 4 → mean 5.33, median 5, range 4–9.
Variance: deviations² sum = 24.0 → sample variance = 3.00, SD = 1.73. Remarkably low variance — City are very consistent at winning 4–6 corners at home. Only the Real Madrid UCL game (9) is a clear outlier from this band.

**Corners conceded**: 2, 6, 1, 5, 6, 4, 4, 4, 6 → mean 4.22, median 4, range 1–6.
Variance: sample variance = 3.19, SD = 1.79.

**Home totals**: 6, 15, 7, 10, 13, 8, 9, 8, 10 → mean 9.56, median 9, range 6–15.
Sample variance = 8.28, SD = 2.88.

**All-games (n=20)**:
Corners won: mean 6.45, median 6, range 3–15. Variance = 10.58.
Corners conceded: mean 3.55, median 4, range 1–6. Variance = 2.89.
Totals: mean 10.0, median 9.5, range 6–16. Variance = 9.79, SD = 3.13.

**Venue vs overall delta**: home mean total 9.56 vs all-games 10.0 (−0.44). Home corners won 5.33 vs 6.45 (−1.12). City win notably fewer corners at home than away — likely because away opponents press more at the Etihad (City also concede 4.22 at home vs 3.55 overall). At home, City tend to control games patiently rather than generating corner-producing attacks.

**Trend (recent ~6 vs older 14)**:
Recent 6 all-games totals: 16, 6, 6, 15, 16, 11 → mean 11.67.
Older 14: mean 10.0.
Upward trend driven almost entirely by the Chelsea (16) and West Ham (16) away blowouts. Recent home games: Liverpool FA Cup (6), Real Madrid UCL (15), Nott Forest PL (7) → mean 9.33. The Real Madrid game inflates this; without it, recent home = 6.5. **No genuine upward trend at home** — the Real Madrid UCL game is contextually unique (high-intensity knockout).

**PL-only home games (n=4)**: 7, 10, 8, 10 → mean 8.75, range 7–10. Very tight. This is the most directly comparable subset for a PL match and suggests lower totals than the 9.56 overall home average.

**Threshold frequencies (home, n=9)**:
Over 8.5: 6/9 = 66.7% | Over 9.5: 4/9 = 44.4% | Over 10.5: 2/9 = 22.2% | Over 11.5: 2/9 = 22.2%

**Threshold frequencies (all games, n=20)**:
Over 8.5: 13/20 = 65.0% | Over 9.5: 12/20 = 60.0% | Over 10.5: 8/20 = 40.0% | Over 11.5: 5/20 = 25.0%

City home games fall under the 9.5 line 55.6% of the time. The PL-only home subset (n=4) goes Under 9.5 in 2/4 = 50%.

---

### 1C. Arsenal (Away) — Corner Stats

**Away games (n=9)**: Sporting CP UCL (7), Southampton FA Cup (13), Leverkusen UCL (5), Mansfield FA Cup (12), Brighton PL (7), Tottenham PL (7), Wolves PL (4), Brentford PL (10), Leeds PL (16).

**Corners won**: 4, 9, 3, 8, 3, 5, 3, 4, 12 → mean 5.67, median 4, range 3–12.
Sample variance = 10.50, SD = 3.24. High variance — Arsenal's away corners won range from 3 (compact games vs Leverkusen, Brighton, Wolves) to 12 (demolition at Leeds). The median (4) is notably below the mean (5.67), indicating right-skew driven by the Leeds and Southampton games.

**Corners conceded**: 3, 4, 2, 4, 4, 2, 1, 6, 4 → mean 3.33, median 4, range 1–6.
Sample variance = 2.25, SD = 1.50.

**Away totals**: 7, 13, 5, 12, 7, 7, 4, 10, 16 → mean 9.0, median 7, range 4–16.
Sample variance = 16.0, SD = 4.0. Very high variance. Median (7) far below mean (9.0) — again right-skewed by Leeds (16) and Southampton (13).

**All-games (n=20)**:
Corners won: mean 6.35, median 5, range 2–12. Variance = 8.77.
Corners conceded: mean 3.35, median 3, range 0–10. Variance = 6.03.
Totals: mean 9.95, median 10.5, range 4–18. Variance = 15.23, SD = 3.90.

**Venue vs overall delta**: away total 9.0 vs all-games 9.95 (−0.95). Arsenal generate fewer corners away, consistent with being more cautious on the road. Conceded rate is essentially identical (3.33 vs 3.35).

**Trend**: Recent 6 all-games: 11, 11, 7, 13, 6, 18 → mean 11.0. Older 14: mean 9.5. Upward trend driven by the Leverkusen home UCL game (18). Without it: recent 5 = 9.6, only marginally above baseline. No clear directional trend away — recent away games (7, 13, 5, 12, 7) bounce around the mean.

**PL-only away (n=5)**: 7, 7, 4, 10, 16 → mean 8.8. Without Leeds (16): mean 7.0 (n=4). Against PL sides that aren't bottom-table, Arsenal's away total is typically 4–10.

**Threshold frequencies (away, n=9)**:
Over 8.5: 4/9 = 44.4% | Over 9.5: 4/9 = 44.4% | Over 10.5: 3/9 = 33.3% | Over 11.5: 3/9 = 33.3%

**Threshold frequencies (all games, n=20)**:
Over 8.5: 11/20 = 55.0% | Over 9.5: 11/20 = 55.0% | Over 10.5: 10/20 = 50.0% | Over 11.5: 5/20 = 25.0%

Arsenal away games fall under 9.5 in 55.6% of cases. Against PL opposition away (n=5): 3/5 = 60% Under 9.5 (or 75% excluding Leeds).

---

### 1D. Outlier Check

Combined 40 games: mean = 9.975, sample variance = 12.19, SD = 3.49.
2σ threshold: upper = 16.96, lower = 2.99.

**Flagged outlier**: Arsenal vs Bayer Leverkusen home, 18 total corners (Mar 17). 2.30σ above mean. This was a high-tempo UCL quarter-final with 10 Arsenal corners won and 8 Leverkusen corners won — both sides pressing aggressively in a 2-0 Arsenal win. Leverkusen's attacking style (Wirtz, Schick) generated many corners in a way City's more controlled approach likely won't replicate.

**Near-outliers**: City vs Chelsea away (16, 1.73σ) and City vs West Ham away (16, 1.73σ). Both just below the 2σ threshold. The Chelsea game was a 3-0 City rout with 12 corners won by a dominant City side. The West Ham game featured 15 City corners in a 1-1 draw where City pressed relentlessly. Both were away games — not applicable to City's home pattern.

**Impact on venue-filtered averages**: The Leverkusen outlier is an Arsenal HOME game, so it does not affect the Arsenal away subset used for this analysis. No outliers in City's home data. No adjustments needed to venue-filtered averages.

**All-games averages with/without outlier**:
Arsenal: total mean 9.95 → without Leverkusen (18): 181/19 = 9.53. The outlier inflates Arsenal's all-games mean by 0.42 corners.

---

### 1E. Head-to-Head

**Same venue H2H (Etihad, City home)**: only 1 game — Sep 2024, City 8 Arsenal 2, total 10. This game is 19 months old. City's squad overlap with predicted XI: ~4–5/11 (Ederson→Donnarumma, Walker→Nunes, Gvardiol→O'Reilly, Gündoğan out, Akanji→Khusanov). Arsenal overlap: ~7/11 (Raya, Saliba, Gabriel, Rice, Havertz, Trossard retained). **Heavily discounted** — City are essentially a different team.

**All H2H (4 games, most recent first)**:

| Date | Venue | City | Arsenal | Total | Score |
|------|-------|------|---------|-------|-------|
| Mar 2026 | Arsenal H (EFL Cup) | 3 | 3 | 6 | 2-0 City |
| Sep 2025 | Arsenal H (PL) | 1 | 11 | 12 | 1-1 |
| Feb 2025 | Arsenal H (PL) | 2 | 5 | 7 | 1-5 Ars |
| Sep 2024 | City H (PL) | 8 | 2 | 10 | 2-2 |

City avg: 3.5 corners. Arsenal avg: 5.25. Total avg: 8.75.

**Corner-count winner**: Arsenal won corners in 2 of 4, City in 1, drawn in 1. But these are ALL at Arsenal's home (3 of 4), and the one Etihad game was 19 months ago.

**Personnel continuity with predicted XIs**:
- Mar 2026 (EFL Cup): City ~9/11 overlap (Trafford/Ake differ), Arsenal ~9/11 overlap (Kepa/Saka differ). Most relevant — recent, high overlap. But a 6-corner cup game where Guardiola killed the tempo after City went ahead. Very tactical, low-intensity second half.
- Sep 2025 (PL): City ~7/11, Arsenal ~7/11. 7 months old with moderate personnel drift. Discounted moderately. The 12-corner game was dominated by Arsenal (11-1) at their home — Arsenal pressed ferociously in a title-race fixture.
- Feb 2025: City ~3–4/11 (Ortega, Akanji, Stones, Gvardiol, Kovačić — completely different spine). Discounted very heavily.
- Sep 2024: City ~4–5/11. Discounted very heavily.

**Key H2H takeaway**: the only high-overlap, recent game (Mar 2026, 6 total) was a controlled, tactical affair. But it was a cup game at Arsenal's home with City content to protect a lead. This PL fixture at the Etihad with must-win context for City should be higher-tempo. The H2H dataset is thin, venue-mismatched, and heavily context-dependent — low analytical weight.

---

### 1F. Lineup, Substitution & Formation

**Predicted City XI (4-2-3-1)**: Donnarumma; Nunes, Khusanov, Guéhi, O'Reilly; Silva, Rodri; Semenyo, Cherki, Doku; Haaland.

**Predicted Arsenal XI (4-2-3-1)**: Raya; White, Saliba, Gabriel, Hincapié; Zubimendi, Rice; Trossard, Havertz, Martinelli; Gyökeres.

#### Player–Corner Correlations (City)

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|----------|------------|-------------|--------------|---------------|
| Doku | 8 | 7.4 | 5.8 | 10.5 | 9.7 |
| Semenyo | 14 | 6.1 | 7.3 | 9.6 | 11.0 |
| Cherki | 11 | 5.9 | 7.1 | 9.7 | 10.3 |
| Rodri | 15 | 6.5 | 6.2 | 9.8 | 10.6 |

**Doku is the standout**: City win 1.6 more corners per game when he starts (7.4 vs 5.8). His direct running and dribbling from the left wing generate corner opportunities through forced saves and deflected crosses. At home specifically, Doku has only 2 meaningful starts (FA Cup vs Liverpool: 4w, UCL vs Real Madrid: 9w) — average 6.5 won, above the home baseline of 5.33.

Semenyo and Cherki both show a *negative* correlation — corners are lower when they start. This is almost certainly confounded: Semenyo starts in 14/20 games (near-ubiquitous), and the 6 games without him include open European ties (Real Madrid 15, Bodø/Glimt 11) that inflate the "out" average. Not a genuine signal.

#### Player–Corner Correlations (Arsenal)

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|----------|------------|-------------|--------------|---------------|
| Madueke | 8 | 7.5 | 5.6 | 10.1 | 9.8 |
| Saka | 9 | 5.7 | 6.9 | 9.1 | 10.2 |
| Martinelli | 14 | 6.3 | 6.4 | 9.7 | 10.4 |
| Gyökeres | 14 | 5.9 | 7.3 | 9.6 | 9.8 |

**Madueke's absence is significant**: Arsenal win 1.9 more corners per game when Madueke starts (7.5 vs 5.6). His direct dribbling from the right wing, in the Saka mould, generates corner opportunities. He is NOT in the predicted XI — replaced by Trossard, a more combinative, less direct player. This is the most consequential personnel difference for this analysis.

Saka's data is counterintuitively negative (higher corners without him), but this is confounded by opponent quality — his absences include cup games against weak sides (Mansfield 8w, Kairat 11w, Leeds 12w).

#### Early Attacking Subs (before 70')

City made early attacking substitutions in 11/20 games, averaging 10.7 total corners vs 8.9 in games without. Confounded by game state — early subs typically happen when City are chasing or need to change the game. No clean causal signal.

Arsenal's triple sub at 54' against Bournemouth (game #2) and quadruple sub at 58' against Man Utd (game #20) both produced 11 total corners. Early subs correlate with Arsenal pushing for a result, which naturally generates corners.

---

### 1G. Absence Impact

**Arsenal confirmed/predicted absences:**
- **Bukayo Saka**: absent from the last 4+ Arsenal games (not in XI or subs since at least Apr 4). Likely injured. As Arsenal's primary right-wing threat, his absence removes a key dribble-and-cross danger. However, as noted in 1F, the statistical impact on corners is confounded. Madueke has been the direct replacement and performs similarly for corner generation.
- **Noni Madueke**: NOT in predicted XI despite starting the last 3 games. If rested due to the 3-day turnaround from CL, Arsenal lose BOTH their specialist right-wing dribblers. This is the most significant absence for corners — per 1F, Arsenal win 1.9 fewer corners without Madueke.
- **Martin Odegaard**: intermittent starter, not in predicted XI. His absence removes a creative midfielder who generates chances in the final third but is not a primary corner-generator.

**Manchester City**: no significant absences. The predicted XI is their strongest available lineup. Rayan Aït-Nouri (who has rotated at LB) is replaced by O'Reilly — a like-for-like swap with minimal corner impact. Ruben Dias replaced by Guéhi — again minimal corner impact (both centre-backs, not corner-generators).

---

### 1H. Contextual Factors

**League baseline**: PL average is approximately 10.0–10.5 total corners per game. City's home average (9.56) is slightly below; Arsenal's away average (9.0) is notably below. Both teams' PL-specific venue averages are lower still (~8.75–8.8).

**Score-state**: high corner counts in City's data coincided with both leading (Chelsea away 12w in a 3-0 win — pressing relentlessly despite leading) and trailing (Real Madrid home 9w in a 1-2 loss — chasing the game). For Arsenal, the Leeds 12w came in a 4-0 demolition. No single score-state dominates.

**Motivation & form**: Arsenal are 1st on 70 points, 6 clear of City (64). A draw secures Arsenal's position and virtually guarantees the title. City must win to maintain any realistic title challenge — Guardiola explicitly stated "if we lose, it's over." This creates an asymmetric motivation dynamic:
- **City**: highly aggressive, must-win. Expected to press high, commit bodies forward, attack relentlessly. This should generate more shots, more blocked shots, more crosses → more corners for City.
- **Arsenal**: a draw is acceptable. With 3 days rest from their CL quarter-final vs Sporting CP (Apr 15), Arsenal may adopt a pragmatic approach — defend compactly, counter-attack selectively, manage energy.

**Rest differential**: City had 7 days since their Chelsea win (Apr 12). Arsenal had just 3 days since the Sporting CL game (Apr 15, 0-0 draw). This is the widest rest gap in their recent schedules. Fatigue typically manifests as reduced pressing intensity, fewer sprints into the box, and lower overall attacking tempo — all of which reduce the fatigued team's own corner generation.

**Tactical context**: Guardiola referenced the Carabao Cup final (4-2-4 setup) and expects Arteta to adjust. Both managers are elite tacticians. High-stakes matches between top sides often produce tight, controlled affairs with fewer corners than average — the EFL Cup meeting (6 total) exemplifies this pattern. However, City's desperation could override tactical discipline and produce a more open game.

---

### Phase 2 — Predicted Distribution

**Manchester City corners won — central estimate: 5.5 (range 4–7)**

Primary input: City's home corners-won average of 5.33 (n=9, SD=1.73). This is an unusually consistent dataset — four of nine home games saw exactly 4 corners won, and only one exceeded 7 (Real Madrid UCL, 9). The low variance (3.00 vs mean 5.33) indicates City's home corner output is tightly clustered around 4–6 regardless of opponent.

Upward adjustments: must-win motivation adds attacking intent (+0.3 corners); 7-day rest advantage means more energy for pressing runs (+0.1); Doku starting adds a dribble-and-cross threat that correlates with higher corner counts (+0.2). Net: +0.6 from home baseline of 5.33 → 5.9.

Downward adjustments: Arsenal's elite defence is better than City's average home opponent — Arsenal concede only 3.33 corners/game away (−0.4). The low conceded rate primarily reflects Arsenal's territorial dominance rather than a specific corner-prevention tactic, but it does indicate Arsenal limit opposition attacking entries.

Net: 5.33 + 0.6 − 0.4 = 5.5. This aligns with City's PL-home average of 4.75 corners won (n=4) adjusted upward for motivation, and sits between the home average (5.33) and the all-games average (6.45). I give more weight to the venue-filtered data because City demonstrably behave differently at home.

**Arsenal corners won — central estimate: 4.5 (range 3–6)**

Primary input: Arsenal's away corners-won average of 5.67 (n=9, SD=3.24). However, the median is only 4 and the distribution is right-skewed — five of nine away games saw 3–4 corners won, with the Leeds (12) and Southampton (9) games inflating the mean.

Downward adjustments: 3-day turnaround from CL reduces pressing intensity (−0.3); draw-is-acceptable motivation means less need to force corners (−0.3); absence of Madueke (and Saka) removes Arsenal's primary right-wing dribbling threat — per the player correlation data, Arsenal win 1.9 fewer corners without Madueke. However, Trossard is still a quality attacker, so the full effect won't materialise (−0.5 of the 1.9 effect).

Upward considerations: City's home corners-conceded rate is 4.22 per game — opponents DO generate chances against City at home. Wolves won 6, Newcastle 5, Salford 6. Arsenal are better than all of these and should at minimum match the baseline conceded rate.

Net: 5.67 − 0.3 − 0.3 − 0.5 = 4.57 ≈ 4.5. The median of Arsenal's away data (4) supports this — without the skew-inflating outliers, Arsenal's typical away corner output is 3–5.

**Total corners — central estimate: 10.0 (range 8.5–11.5)**

Per-team sum: 5.5 + 4.5 = 10.0. Cross-checks:
- City home total avg: 9.56. Arsenal away total avg: 9.0. Average: 9.28. My 10.0 is 0.72 above this average, reflecting City's motivational boost.
- PL-specific venue averages: City home 8.75, Arsenal away 8.8. Average: 8.78. My 10.0 is 1.22 above — the largest divergence, but PL samples are small (n=4 and n=5) and this specific match has above-average intensity.
- All-games averages: City 10.0, Arsenal 9.95. Average: 9.975. Essentially identical to my estimate.
- League average: ~10.0–10.5. My estimate is right at the lower bound.

**Spread (City − Arsenal) — central estimate: +1.0 (range −1 to +4)**

City 5.5 − Arsenal 4.5 = +1.0. City are expected to win the corner count by approximately 1. The range is wide because corner counts between teams are not strongly correlated and individual game variance is high (SD of spread ≈ 3.7 based on the sum of venue-filtered per-team variances).

### Reconciliation

**Contradiction 1**: City's home corner-won average (5.33) vs their all-games average (6.45) — a 1.12-corner gap. Resolution: City genuinely play differently at home (more controlled possession, less need to force the issue). The venue-filtered data is the correct anchor. I add 0.2 for motivation, not the full 1.12.

**Contradiction 2**: Arsenal's away corners-won median (4) vs mean (5.67) — the right-skewed distribution. Resolution: I use 4.5 as the central estimate, between median and mean, reflecting that the Leeds/Southampton blowouts against weak PL opposition are unlikely to recur against City.

**Contradiction 3**: H2H average total (8.75) vs my predicted total (10.0). Resolution: three of four H2H games were at Arsenal's home (not the matching venue). The one Etihad game (10 total) had very different squads. The recent EFL Cup game (6 total) was a tactical cup match where City protected a lead — not comparable to a must-win PL match. I do not anchor to H2H data.

**Contradiction 4**: Arsenal's away corners-conceded rate (3.33) implies City should win only ~3.3 corners, but I estimate 5.5. Resolution per methodology: a team's own corners-won data is the primary input. Arsenal's low conceded rate reflects their overall territorial dominance against typically inferior opponents. City at home are not a typical opponent — they will have sustained attacking phases that most Arsenal away opponents don't. I trust City's own home attacking data (5.33 mean, adjusted to 5.5) over the opponent-conceded rate.

---

### Phase 3 — Value Identification

#### Variance & Distribution Model

City home total variance: 8.28 (n=9). Arsenal away total variance: 16.0 (n=9).
Average: (8.28 + 16.0) / 2 = 12.14.

μ = 10.0, σ² = 12.14. Since σ² (12.14) > μ (10.0), variance exceeds mean → **Negative Binomial**. However, the overdispersion is modest (σ²/μ = 1.21), so the NegBin closely approximates Poisson.

NegBin parameters: r = μ²/(σ²−μ) = 100/2.14 = 46.7. p = μ/σ² = 10.0/12.14 = 0.824. With r ≈ 47, the NegBin is nearly indistinguishable from Poisson(10.0) — tails are only fractionally fatter.

I use Poisson(10.0) for totals and note the NegBin adjustment is negligible.

#### Available Odds (via sportsgambler.com)

| Market | Line | Odds (American) | Odds (Decimal) | Implied Prob |
|--------|------|-----------------|----------------|-------------|
| Total corners | Over 9.5 | −122 | 1.820 | 54.9% |
| Total corners | Under 9.5 | −116 | 1.862 | 53.7% |
| Man City corners | Over 5.5 | +104 | 2.040 | 49.0% |
| Man City corners | Under 5.5 | −147 | 1.680 | 59.5% |
| Arsenal corners | Over 4.5 | +114 | 2.140 | 46.7% |
| Arsenal corners | Under 4.5 | −161 | 1.621 | 61.7% |
| Most corners | Man City | −147 | 1.680 | 59.5% |
| Most corners | Draw | +650 | 7.500 | 13.3% |
| Most corners | Arsenal | +150 | 2.500 | 40.0% |

#### Totals Market

**Over/Under 9.5 total corners:**

*Empirical estimate*: City home games Over 9.5 = 4/9 = 44.4%. Arsenal away games Over 9.5 = 4/9 = 44.4%. Average = 44.4% Over, 55.6% Under.

*Model estimate (Poisson λ=10.0)*: P(Over 9.5) = P(X≥10) = 54.2%. P(Under 9.5) = 45.8%.

These disagree by ~10pp. The empirical rates use venue-filtered data (n=9 each), which captures actual corner production at these venues. The model uses my centrally-adjusted estimate of 10.0, which incorporates motivational factors. The venue-filtered data is "what usually happens"; the model is "what I think will happen given the specific context."

I reconcile by weighting 55% empirical / 45% model:
P(Over 9.5) = 0.55 × 44.4% + 0.45 × 54.2% = 24.4 + 24.4 = 48.8%
P(Under 9.5) = 51.2%

Edge on Over 9.5: 48.8% − 54.9% = **−6.1%** (no value — book overestimates Over probability)
Edge on Under 9.5: 51.2% − 53.7% = **−2.5%** (no value — book already prices Under correctly)

Neither side of 9.5 offers edge. The book's line is well-placed.

#### Team Corners Markets

**Man City Over/Under 5.5:**

My central estimate: 5.5 corners. City home data: ≥6 corners in 3/9 = 33.3% of home games. All-games: ≥6 in 10/20 = 50%. Venue-weighted blend (60/40): 33.3×0.6 + 50×0.4 = 20.0 + 20.0 = 40.0% Over.

But City's home distribution is underdispersed (variance 3.0 < mean 5.33). A Poisson(5.5) gives P(Over 5.5) = 47.1%, but the actual distribution is tighter — the empirical 33.3% is lower because City rarely deviate from 4–6 at home. With motivation adjustment bringing a few more games above 5, I estimate 38–42% Over.

Edge on Over 5.5: ~40% − 49.0% = **−9.0%** (significant negative edge — avoid)
Edge on Under 5.5: ~60% − 59.5% = **+0.5%** (negligible — no value after vig)

**Arsenal Over/Under 4.5:**

My central estimate: 4.5 corners. Arsenal away: ≥5 in 4/9 = 44.4%. Adjustment for fatigue and no Madueke: ~40% Over.

Edge on Over 4.5: ~40% − 46.7% = **−6.7%** (avoid)
Edge on Under 4.5: ~60% − 61.7% = **−1.7%** (no value)

#### Spread / Most Corners

Using Skellam approximation with City λ₁=5.5, Arsenal λ₂=4.5, mean diff=+1.0, variance=5.5+4.5=10.0 (adjusting for City's underdispersion: variance ≈ 3.0+10.5=13.5, SD≈3.67):

P(City wins corner count) ≈ 55.4%. Implied at −147: 59.5%. Edge: **−4.1%** (no value).
P(Arsenal wins corner count) ≈ 34.1%. Implied at +150: 40.0%. Edge: **−5.9%** (no value).

#### Cross-checks

**Book's implied team corners** (inferred from team lines):
- City: book implies ~5.2–5.3 (Under 5.5 favored at −147). My estimate: 5.5. Divergence: +0.2–0.3.
- Arsenal: book implies ~4.0–4.3 (Under 4.5 favored at −161). My estimate: 4.5. Divergence: +0.2–0.5.
- Sum: book implies ~9.3–9.6 total. Line is 9.5. Internally consistent.

My estimates are 0.4–0.7 corners higher than the book in aggregate. This modest divergence is within the range where vig eliminates any edge.

Only one bookmaker's lines were available — cannot assess inter-book disagreements.

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|

**No picks meet the 5% edge threshold.**

The book's corner markets for this match are efficiently priced, closely matching my central estimates across all available lines. The largest probability gap I identify is on City Under 5.5 corners (+0.5% edge against raw implied), which is negligible after vig.

**Monitoring (3–5% edge, not actionable at current odds):**

1. **Under 9.5 total corners** — if odds drift to 1.95+ (implied ≤51.3%), consider. My venue-filtered empirical rate of 55.6% Under would give 4.3% edge at 1.95. The PL-specific data (avg 8.78) supports unders more strongly than the all-games data.

2. **Man City Under 5.5 corners** — if odds drift to 1.80+ (implied ≤55.6%), consider. City's home distribution is remarkably tight around 4–5 corners won (6/9 = 66.7% Under 5.5). The current −147 line already prices in most of this, but at 1.80, the empirical edge would be ~11%.

---

## Bets to Avoid

**1. Man City Over 5.5 corners at +104 (2.04)**
This is a trap line. City are at home, must-win, with Doku on the wing — superficially attractive for an Over on City corners. But City have won 6+ corners in only 3 of 9 home games (33.3%). Their home corner output is remarkably consistent at 4–5, and the low variance (SD=1.73) means deviations are rare even in high-stakes games. The odds imply 49% probability — far above the 33–40% the data supports. The book appears to have anchored too heavily on City's all-games average (6.45) rather than the tighter home distribution.

**2. Arsenal Over 4.5 corners at +114 (2.14)**
Arsenal's away corner profile is highly skewed — median 4, mean 5.67. Without the Leeds blowout (12 won), the away average drops to 4.9. Add in the 3-day CL turnaround, conservative tactical approach (draw is fine), and absence of Madueke's right-wing dribbling threat, and Arsenal are likely to land at 3–4 corners, not 5+. The 46.7% implied probability is generous; the true probability is closer to 38–42%.

---

## Caveats

1. **Small venue-filtered samples**: n=9 home for City, n=9 away for Arsenal. PL-specific subsets are even thinner (n=4 and n=5). Confidence intervals on proportions are wide — ±20–30pp at these sample sizes.

2. **Single source of odds**: all lines from one bookmaker (sportsgambler.com). No alternate totals (8.5, 10.5, 11.5) or corner spread handicaps were available. Value may exist on lines I could not assess.

3. **Saka/Madueke status unconfirmed**: the predicted lineup excludes both, but official team sheets are not yet available. If Madueke starts, Arsenal's corner-generating ability improves significantly (avg 7.5 won with Madueke vs 5.6 without), which would shift the total upward by ~0.5–1.0.

4. **No referee data**: referee assignment was not available. Strict referees who call more fouls can disrupt attacking flow and indirectly suppress corners; lenient referees may allow more physical play, which can also suppress corner-generating attacks. This is an unquantified variable.

5. **Model limitations**: the near-Poisson distribution model assumes independence between teams' corner counts. In practice, game flow creates correlation — open games inflate both teams' counts, cagey games suppress both. This primarily affects spread confidence, not total estimates.

6. **Motivation is hard to quantify**: City's must-win desperation could produce anything from a controlled 1-0 pressing performance (few corners) to a frantic siege (many corners). The historical data does not cleanly separate "motivated" from "typical" home games.

Sources:
- [Manchester City vs Arsenal Prediction, Betting Tips, Lineups & Odds | sportsgambler.com](https://www.sportsgambler.com/betting-tips/football/manchester-city-vs-arsenal-prediction-lineups-odds-2026-04-19/)
- [Man City vs Arsenal Predictions, Picks & Odds | covers.com](https://www.covers.com/soccer/man-city-vs-arsenal-predictions-picks-odds-premier-league-sunday-april-19-2026)