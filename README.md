# NBA Eras Under Pressure

Interactive web visualization project for exploring how NBA game structure changed across eras using FiveThirtyEight historical NBA Elo data.

## Project Link

https://anaskhoury.github.io/nba-eras-under-pressure/

## Topic

This project studies how home-court advantage, scoring, close games, franchise strength, and Elo upsets changed across NBA history from 1947 to 2015.

## Main Research Question

How did the character of NBA games change across eras, and which franchises stand out when comparing different definitions of performance?

## Dataset

The project uses the FiveThirtyEight Historical NBA Elo dataset:

https://github.com/fivethirtyeight/data/tree/master/nba-elo

The original dataset contains one row per team per game. Since each game appears twice, the data was preprocessed into unique game-level records and aggregated summaries.

After preprocessing:
- 59,008 unique NBA games
- 69 seasons, from 1947 to 2015
- 45 franchises

## Visualizations

The dashboard includes four linked views:

1. **Season Trends**  
   Shows how home win rate, scoring, close-game rate, and upset rate changed over time.

2. **Era Map**  
   Compares average total points and average scoring margin by season, colored by historical era.

3. **Franchise Ranking**  
   Ranks franchises by win rate, average margin, average Elo, or points scored.

4. **Game Explorer**  
   Shows surprising Elo upsets and scoring-margin patterns for the selected filters.

## Interaction

Users can:
- Filter by season range.
- Select a franchise.
- Switch Season Trends metrics.
- Switch Franchise Ranking metrics.
- Click a season to focus the Game Explorer.
- Click a franchise bar to filter all views.
- Hover over marks to see exact values.

## Tools

- HTML
- CSS
- JavaScript
- D3.js v7
- Python for preprocessing

## Notes

This is a static web project and can run directly through GitHub Pages.