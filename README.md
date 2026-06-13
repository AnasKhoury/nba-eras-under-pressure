# NBA Eras Under Pressure

Interactive web dashboard for exploring how NBA game structure changed across historical eras using FiveThirtyEight NBA Elo data.

## Live Project

https://anaskhoury.github.io/nba-eras-under-pressure/?v=final-20260613-2

## Project Overview

This project analyzes NBA history from 1947 to 2015 through the question:

**How did NBA eras differ in scoring, home-court advantage, competitiveness, franchise strength, and unexpected results?**

Instead of presenting the dataset as a static table, the project turns historical game data into a linked interactive dashboard. The user can move between league-wide trends, era-level comparisons, franchise rankings, advanced relationship views, and individual surprising games.

## Dataset

The project uses FiveThirtyEight's historical NBA Elo dataset.

Dataset source:  
https://github.com/fivethirtyeight/data/tree/master/nba-elo

The original data contains game-level NBA records with Elo ratings, team information, scores, forecasts, and game outcomes. The dashboard uses processed versions of the data for faster interaction and clearer visualization.

Processed files include:

- `metadata.json`
- `season_summary.json`
- `team_summary.json`
- `team_seasons.json`
- `highlight_games.json`

## Main Analytical Questions

The dashboard helps explore these questions:

- How did home-court advantage change across NBA eras?
- Did high-scoring eras also produce closer or more unpredictable games?
- Which franchises stand out under different success metrics?
- How do franchise rankings change across eras?
- Which games were the largest Elo-based surprises?

## Dashboard Views

### Season Trends

Shows league-level metrics over time. The user can switch between home win rate, scoring, close-game rate, and upset rate.

### Era Map

Compares average total points and average scoring margin. Each dot represents a season and color represents the NBA era.

### Scoring Pressure Relationship

An advanced scatterplot that compares scoring level with close-game rate, upset rate, or average margin. Era trend lines show whether the relationship changes across historical periods.

### Franchise Ranking

Ranks franchises by selectable metrics: win rate, average margin, average Elo, and points scored. Clicking a franchise filters the entire dashboard.

### Era Profile Matrix

A heatmap comparing NBA eras across several pressure signals at once: home win rate, scoring, close games, upsets, and average margin.

### Franchise Rank Flow

Shows how leading franchises move across eras according to the selected ranking metric.

### Game Explorer

Lists notable game-level surprises and close games from the current selection.

## Interaction

The dashboard supports:

- Season range filtering
- Franchise filtering
- Metric switching
- Clickable season points
- Clickable franchise bars
- Hover tooltips with exact values
- Linked views across the dashboard
- Resetting all filters

These interactions allow the user to move from broad historical patterns to specific teams, seasons, and games.

## Tools and Libraries

- HTML
- CSS
- JavaScript
- D3.js
- Python for preprocessing
- GitHub Pages for deployment
- OpenAI / ChatGPT / Codex assistance for coding, writing, debugging, and project refinement

## Data Processing

The original FiveThirtyEight dataset was processed into dashboard-ready JSON files. The preprocessing included:

- Treating each game once instead of duplicating both team rows
- Calculating home win rate
- Calculating total points per game
- Calculating scoring margin
- Defining close games as games decided by 5 points or fewer
- Defining upsets as games where the winner had less than a 50% Elo forecast
- Aggregating results by season, era, and franchise
- Creating highlighted game records for the game explorer

## How to Run Locally

Open a terminal in the project folder and run:

```bash
python -m http.server 8000