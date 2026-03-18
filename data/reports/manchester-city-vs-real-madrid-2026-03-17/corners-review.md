## Predictions vs Actuals

| Metric | Predicted | Actual | Verdict |
|--------|-----------|--------|---------|
| Total corners | 9–13 (central 10.5) | **15** | Miss — 4.5 above central estimate |
| Man City corners won | 6–10 (central 8.0) | **9** | Hit — within range, 1 above central |
| Real Madrid corners won | 1–4 (central 2.5) | **6** | Miss — 3.5 above central, above range ceiling |
| Corner spread (City−Madrid) | City −5.5 (range −2 to −9) | **City −3** | Miss — Madrid far more active than predicted |

Value pick outcomes:

| # | Pick | Line | Odds | Predicted Prob | Result | Outcome |
|---|------|------|------|---------------|--------|---------|
| 1 | Under Total Corners | 11.5 | 2.16 | 64% | 15 corners | **LOSS** |
| 2 | Under Total Corners | 10.5 | 2.75 | 52% | 15 corners | **LOSS** |
| 3 | City Under Team Corners | 9.5 | 1.714 | 72% | 9 corners | **WIN** |

**Overall: 1 of 3 picks correct.** The single win (City U9.5) was the lowest-edge, lowest-odds pick. Both total-corner Unders lost badly — the actual total of 15 exceeded even the upper bound of the predicted range (13).

---

## What Worked

**City Under 9.5 Team Corners — correct by the thinnest margin (9 actual vs 9.5 line)**

The pre-game analysis argued that City's structural playstyle suppresses their own corner volume, even when chasing. The central estimate of 8.0 was only 1 off the actual (9), and the prediction that City would not reach the book's implied ~9.5 was correct.

- **Skill vs luck**: Mixed. The reasoning was right — City's patient build-up limits corner generation even under pressure — but a massive unforeseen factor (Bernardo Silva red card at 20') actually *suppressed* City's corner count. With 10 men for 70 minutes, City couldn't sustain the attacking waves that would have driven corners higher. Without the red card, City likely exceed 9.5. The pick won, but partly for the wrong reasons.
- **Repeatable edge**: The structural insight about City's low-corner playstyle is valid and repeatable. The specific margin of safety here was razor-thin and relied on an unforeseeable event. Low confidence this edge survives in a full-strength scenario.

**City's corner estimate directionally sound**: Predicting City in the 6–10 range captured the actual (9). The analysis correctly identified City's desperation uplift over their 5.33 home baseline.

---

## What Missed

### 1. Real Madrid corners: predicted 2.5, actual 6 (+3.5 miss)

This was the analysis's biggest error and the primary driver of the total-corners miss.

- **Root cause: Unforeseen game flow + Weighting error**. The Bernardo Silva red card at 20' transformed the match. With City reduced to 10 men, Madrid gained sustained territorial advantage — the opposite of the predicted "sit deep and counter" approach. Madrid didn't need to counter-attack; they could press and attack normally against a shorthanded side. Additionally, **Mbappé's involvement** (the analysis flagged his squad return as a risk but treated it as a bench-only scenario) added attacking impetus.
- **Weighting error on defensive intent**: The analysis over-weighted Ancelotti's "defend well" messaging. With a man advantage from minute 20, Madrid's tactical plan shifted from deep-block defence to active attacking. The pre-game framing treated Madrid's defensive intent as fixed rather than contingent on match state.
- **Was the miss predictable?** The red card was not predictable. However, the analysis should have stress-tested: "What if an early sending-off changes the match dynamic?" The sensitivity analysis noted score-state changes but not personnel changes. A 10-man scenario would have pushed Madrid's estimate from 2.5 toward 5–6, which is exactly where it landed.

### 2. Total corners: predicted 10.5, actual 15 (+4.5 miss)

- **Root cause: Compounding errors from Madrid estimate + game-flow disruption**. The total miss is almost entirely driven by Madrid's 3.5-corner overperformance. City's 9 was within range (only +1 vs central estimate). The model's total was built on Madrid generating 2.5 corners — once that assumption collapsed, the total followed.
- **Model error**: The sub-Poisson variance assumption (variance 2.62 vs mean 10.5) was valid for normal match conditions but completely inappropriate for a match with a red card at 20'. Red cards introduce regime change — the game becomes a fundamentally different statistical process. The tight Poisson distribution had no mechanism to account for this.
- **Was the miss predictable?** Not in the specific form (red card), but the analysis under-explored high-variance scenarios. The caveats mentioned "score-state sensitivity" but not player-dismissal sensitivity — a blind spot.

### 3. Corner spread: predicted City −5.5, actual City −3

- **Root cause: Madrid overperformance** (same as above). City's 9 minus Madrid's 6 = +3 for City. The spread compressed because Madrid generated far more corners than the defensive-shell scenario predicted.

---

## Key Learnings

1. **Build a "red card scenario" into every match model.** The analysis ran sensitivities on score-state changes and Mbappé starting, but never asked "what happens with 10 men?" A simple rule: flag that any team-corner estimate shifts +2 to +3 for the side gaining the man advantage, and the total shifts +3 to +5. If this had been applied, the total estimate would have had a conditional range of 13–16, correctly capturing the 15 outcome.

2. **Treat tactical intent as state-dependent, not fixed.** Ancelotti's "defend well" was valid for 11v11 with a 3-0 lead. It became irrelevant at 10v11 after 20 minutes. Pre-game managerial quotes should be weighted as the *initial* plan, not the match-long strategy. Future analyses should note: "This tactical assessment is contingent on normal match conditions."

3. **Discount first-leg anchoring for the away team's corner estimate when the tactical context reverses.** The first leg showed Madrid winning only 1 corner while leading 3-0 at home. The analysis extrapolated this to the second leg. But the second leg was always going to feature a different Madrid approach (even before the red card) — City at the Etihad needing goals would create more back-and-forth than Madrid cruising at the Bernabéu. The away team's H2H corner count from a comfortable lead is a poor predictor of their output in a competitive return leg.

4. **The City structural corner-suppression thesis held, even under extreme pressure.** City got 9 corners — high for them, but still under the book's 9.5 line despite 90 minutes of desperation. The patient-build-up playstyle genuinely caps corner output. This is a durable edge for future City matches, particularly the Under on City team corners.

5. **When the book's total line is 2+ corners above your estimate, check what game-flow scenario would validate the book.** The book had the total at ~12.0. The analysis dismissed this as narrative-driven. But the book may have been pricing in tail risks (red cards, early goals, game-state chaos) that the model treated as zero-probability. A simple exercise: "What would need to happen for 12+ corners?" would have surfaced red-card and early-goal scenarios as plausible paths to the Over.

6. **Short corners generate recycled corner counts.** The post-match data notes City used short corners extensively after the red card (Reijnders in 1H, Cherki in 2H). Short corners that get recycled back inflate the corner count without representing genuine attacking threat. Future models should note that teams playing with fewer men often use short corners as a possession-retention tool, artificially boosting corner counts.

---

## Market-Specific Insights

### Corner Patterns Observed

- **City's corners were front-loaded in intent but spread across the match**: Despite needing goals urgently, the red card at 20' forced City into a different mode — retaining possession carefully with 10 men rather than wave after wave of attacks. Short corners became a pressure-management tool.
- **Madrid's 6 corners came from genuine attacking territory**, not just set-piece recycling. With the man advantage, Madrid pressed higher and generated corners through sustained possession in City's third — a pattern completely absent from the first leg (1 corner) and the pre-game model.
- **Corner clusters**: The post-match data shows only 3 of 15 corners were genuinely dangerous (Khusanov shot ~35', Tchouaméni header 69', Mbappé shot 70'). An 80% ineffective rate suggests the high count was driven by volume, not quality — consistent with a chaotic, stretched match.
- **Home/away generation vs expectations**: City generated 9 at home (predicted 8, so +1) — the home factor was present but muted by the numerical disadvantage. Madrid generated 6 away (predicted 2.5, so +3.5) — the away suppression thesis collapsed entirely.

### Defensive/Offensive Trends

- **City's defensive shape with 10 men** naturally conceded more territory, leading to Madrid corners from sustained pressure rather than quick counters. This is a different corner-generation mechanism than predicted (counter-attacks producing occasional corners).
- **Madrid's pressing with the man advantage** was the primary driver of their corner overperformance. Tchouaméni and the midfield could press higher knowing City lacked numbers to exploit the space behind.
- **Formation effects**: City's shift to accommodate 10 men (likely dropping deeper with a more compact shape) reduced their ability to sustain high pressing, limiting corner generation from their own attacks.
- **The Trent Alexander-Arnold → Tchouaméni delivery at 69'** was Madrid's most dangerous corner — a near-post header saved by Donnarumma. Alexander-Arnold's set-piece delivery was a factor the pre-game analysis noted ("no uplift from TAA" in the data) but undervalued in a match where Madrid actually took meaningful corners.

### Bookmaker Line Assessment

- **The book's total of ~12.0 was closer to reality than the model's 10.5**, though even the book undershot the actual 15 by 3 corners. The book likely priced in some tail risk from game-flow disruption that the model explicitly excluded.
- **City team corners at 9.5**: The book was almost perfectly calibrated (actual: 9). This was the tightest line of the three picks.
- **The book's implied Madrid corners (~2.75)** was too low — actual was 6. However, neither the book nor the model could have priced in a 20th-minute red card. Pre-red-card, the book's Madrid estimate was defensible.
- **Market efficiency observation**: The books correctly identified that the "City chasing" narrative would inflate corners but may have concentrated that inflation too heavily on City's side rather than distributing it to both teams. The actual outcome showed the inflation went to *both* teams — City got 9, Madrid got 6 — rather than a lopsided City 11, Madrid 2 scenario.

---

## Summary

- **1 of 3 picks correct (33%)**. City Under 9.5 won at 1.714 odds, but both total-corner Unders lost badly (actual 15 vs lines of 10.5 and 11.5). Net outcome across equal-stake bets: negative.
- **The pre-game edge assessment on totals was unsound** — it correctly identified City's low-corner structural tendency but catastrophically underestimated Madrid's corner output by anchoring to the first-leg defensive shell and Ancelotti's pre-match messaging. The Bernardo Silva red card at 20' was the primary cause, but the model had no mechanism to account for such regime changes.
- **Biggest insight**: Tactical intent is state-dependent. A 3-0 aggregate lead with 11v11 produces a deep block; a 3-0 lead with 11v10 produces active pressing and corner generation. Future models need conditional estimates for disrupted match states, not just score-state changes.
- **Key adjustment**: Introduce a "match disruption premium" of +3 to +5 total corners for red-card scenarios, and stress-test every corner estimate against the question: "What single in-game event would invalidate this prediction?"