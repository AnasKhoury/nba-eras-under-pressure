const fmtPct = d3.format(".1%");
const fmtNum = d3.format(",");
const fmtOne = d3.format(".1f");

const colors = {
  green: "#007f72",
  orange: "#d66b22",
  indigo: "#4656a6",
  red: "#b94046",
  gold: "#a77b09",
  muted: "#667075",
  line: "#d9dedc"
};

const eraColors = new Map([
  ["Early NBA", colors.gold],
  ["Expansion", colors.orange],
  ["Modernizing", colors.indigo],
  ["Spacing era", colors.green],
  ["Recent era", colors.red]
]);

const metricMeta = {
  home_win_pct: { label: "Home win rate", format: fmtPct, color: colors.green },
  avg_total_points: { label: "Average total points", format: fmtOne, color: colors.orange },
  close_game_pct: { label: "Close-game rate", format: fmtPct, color: colors.indigo },
  upset_pct: { label: "Upset rate", format: fmtPct, color: colors.red },
  win_pct: { label: "Win rate", format: fmtPct },
  avg_margin: { label: "Average margin", format: fmtOne },
  avg_elo: { label: "Average Elo", format: fmtOne },
  avg_points_for: { label: "Points for", format: fmtOne }
};

const state = {
  start: 1947,
  end: 2015,
  team: "All",
  seasonMetric: "home_win_pct",
  rankMetric: "win_pct",
  selectedSeason: null
};

const els = {
  start: document.querySelector("#startSeason"),
  end: document.querySelector("#endSeason"),
  startValue: document.querySelector("#startValue"),
  endValue: document.querySelector("#endValue"),
  rangeLabel: document.querySelector("#rangeLabel"),
  teamLabel: document.querySelector("#teamLabel"),
  teamSelect: document.querySelector("#teamSelect"),
  rankMetric: document.querySelector("#rankMetric"),
  tooltip: document.querySelector("#tooltip"),
  gameRows: document.querySelector("#gameRows"),
  focusText: document.querySelector("#focusText")
};

const [
  metadata,
  seasonSummary,
  teamSummary,
  teamSeasons,
  highlightGames
] = await Promise.all([
  d3.json("data/processed/metadata.json"),
  d3.json("data/processed/season_summary.json"),
  d3.json("data/processed/team_summary.json"),
  d3.json("data/processed/team_seasons.json"),
  d3.json("data/processed/highlight_games.json")
]);

state.start = metadata.first_season;
state.end = metadata.last_season;
els.start.min = els.end.min = metadata.first_season;
els.start.max = els.end.max = metadata.last_season;
els.start.value = state.start;
els.end.value = state.end;

teamSummary
  .sort((a, b) => d3.ascending(a.team, b.team))
  .forEach(team => {
    const option = document.createElement("option");
    option.value = team.team;
    option.textContent = team.team;
    els.teamSelect.append(option);
  });

function showTip(event, html) {
  els.tooltip.innerHTML = html;
  els.tooltip.style.opacity = 1;
  const pad = 14;
  const rect = els.tooltip.getBoundingClientRect();
  els.tooltip.style.left = `${Math.min(event.clientX + pad, window.innerWidth - rect.width - pad)}px`;
  els.tooltip.style.top = `${Math.min(event.clientY + pad, window.innerHeight - rect.height - pad)}px`;
}

function hideTip() {
  els.tooltip.style.opacity = 0;
}

function svgFor(target, margins = { top: 16, right: 24, bottom: 42, left: 54 }) {
  const el = document.querySelector(target);
  el.innerHTML = "";
  const width = Math.max(320, el.clientWidth);
  const height = Math.max(260, el.clientHeight || 300);
  const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, width, height]);
  const inner = {
    width: width - margins.left - margins.right,
    height: height - margins.top - margins.bottom
  };
  const g = svg.append("g").attr("transform", `translate(${margins.left},${margins.top})`);
  return { svg, g, width, height, ...inner, margins };
}

function inRange(d) {
  return d.season >= state.start && d.season <= state.end;
}

function activeSeasonData() {
  return seasonSummary.filter(inRange);
}

function activeTeamSeasons() {
  return teamSeasons.filter(d => inRange(d) && (state.team === "All" || d.team === state.team));
}

function summarizeTeamSeasons(rows) {
  const grouped = d3.rollups(
    rows,
    values => ({
      team: values[0].team,
      games: d3.sum(values, d => d.games),
      wins: d3.sum(values, d => d.wins),
      win_pct: d3.sum(values, d => d.wins) / d3.sum(values, d => d.games),
      avg_margin: d3.mean(values, d => d.avg_margin),
      avg_elo: d3.mean(values, d => d.avg_elo),
      avg_points_for: d3.mean(values, d => d.avg_points_for)
    }),
    d => d.team
  );
  return grouped.map(d => d[1]).filter(d => d.games >= 60);
}

function gameFilter(d) {
  return inRange(d)
    && (state.team === "All" || d.team === state.team || d.opponent === state.team)
    && (!state.selectedSeason || d.season === state.selectedSeason);
}

function updateStatus() {
  els.startValue.textContent = state.start;
  els.endValue.textContent = state.end;
  els.rangeLabel.textContent = `${state.start}-${state.end}`;
  els.teamLabel.textContent = state.team === "All" ? "All franchises" : state.team;
  const teamText = state.team === "All" ? "all franchises" : state.team;
  const seasonText = state.selectedSeason ? `season ${state.selectedSeason}` : `${state.start}-${state.end}`;
  els.focusText.textContent = `${seasonText}, ${teamText}`;
}

function updateKpis() {
  const seasons = activeSeasonData();
  const games = d3.sum(seasons, d => d.games);
  const weighted = (field) => d3.sum(seasons, d => d[field] * d.games) / games;
  document.querySelector("#kpiGames").textContent = fmtNum(games);
  document.querySelector("#kpiHome").textContent = fmtPct(d3.sum(seasons, d => d.home_win_pct * (d.games - d.neutral_games)) / d3.sum(seasons, d => d.games - d.neutral_games));
  document.querySelector("#kpiClose").textContent = fmtPct(weighted("close_game_pct"));
  document.querySelector("#kpiUpsets").textContent = fmtPct(weighted("upset_pct"));
}

function drawSeasonChart() {
  const data = activeSeasonData();
  const meta = metricMeta[state.seasonMetric];
  const { svg, g, width, height, margins } = svgFor("#seasonChart", { top: 32, right: 24, bottom: 54, left: 76 });
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.season)).range([0, width]);
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d[state.seasonMetric])).nice()
    .range([height, 0]);
  const line = d3.line()
    .x(d => x(d.season))
    .y(d => y(d[state.seasonMetric]))
    .curve(d3.curveMonotoneX);

  g.append("g").attr("class", "gridline").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", meta.color)
    .attr("stroke-width", 3)
    .attr("d", line);
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "line-point")
    .attr("cx", d => x(d.season))
    .attr("cy", d => y(d[state.seasonMetric]))
    .attr("r", d => d.season === state.selectedSeason ? 6 : 4)
    .attr("fill", d => d.season === state.selectedSeason ? colors.red : meta.color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .on("pointerenter", (event, d) => showTip(event, `<strong>${d.season}</strong><br>${meta.label}: ${meta.format(d[state.seasonMetric])}<br>Games: ${fmtNum(d.games)}`))
    .on("pointermove", (event, d) => showTip(event, `<strong>${d.season}</strong><br>${meta.label}: ${meta.format(d[state.seasonMetric])}<br>Games: ${fmtNum(d.games)}`))
    .on("pointerleave", hideTip)
    .on("click", (_, d) => {
      state.selectedSeason = state.selectedSeason === d.season ? null : d.season;
      render();
    });

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickFormat(meta.format));
  svg.append("text").attr("class", "chart-title").attr("x", margins.left).attr("y", 16).text(`${meta.label} by Season`);
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margins.left + width / 2)
    .attr("y", margins.top + height + 42)
    .attr("text-anchor", "middle")
    .text("Season");
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margins.top + height / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .text(meta.label);
}

function drawEraScatter() {
  const data = activeSeasonData();
  const { svg, g, width, height, margins } = svgFor("#eraScatter", { top: 34, right: 18, bottom: 52, left: 52 });
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.avg_total_points)).nice().range([0, width]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.avg_margin)).nice().range([height, 0]);
  g.append("g").attr("class", "gridline").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.avg_total_points))
    .attr("cy", d => y(d.avg_margin))
    .attr("r", d => d.season === state.selectedSeason ? 8 : 5)
    .attr("fill", d => eraColors.get(d.era))
    .attr("opacity", 0.82)
    .attr("stroke", d => d.season === state.selectedSeason ? colors.red : "#fff")
    .attr("stroke-width", 1.5)
    .on("pointerenter", (event, d) => showTip(event, `<strong>${d.season}: ${d.era}</strong><br>Total points: ${fmtOne(d.avg_total_points)}<br>Avg margin: ${fmtOne(d.avg_margin)}`))
    .on("pointermove", (event, d) => showTip(event, `<strong>${d.season}: ${d.era}</strong><br>Total points: ${fmtOne(d.avg_total_points)}<br>Avg margin: ${fmtOne(d.avg_margin)}`))
    .on("pointerleave", hideTip)
    .on("click", (_, d) => {
      state.selectedSeason = state.selectedSeason === d.season ? null : d.season;
      render();
    });
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y));
  svg.append("text").attr("class", "chart-title").attr("x", margins.left).attr("y", 16).text("Scoring vs. Competitiveness by Era");
  const legend = svg.append("g").attr("class", "chart-legend").attr("transform", `translate(${margins.left + 230}, 7)`);
  [...eraColors.entries()].forEach(([era, color], i) => {
    const item = legend.append("g").attr("transform", `translate(${i * 96}, 0)`);
    item.append("circle").attr("cx", 0).attr("cy", 5).attr("r", 4).attr("fill", color);
    item.append("text").attr("x", 8).attr("y", 9).text(era);
  });
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margins.left + width / 2)
    .attr("y", margins.top + height + 42)
    .attr("text-anchor", "middle")
    .text("Average total points per game");
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margins.top + height / 2))
    .attr("y", 13)
    .attr("text-anchor", "middle")
    .text("Average margin");
}

function drawTeamBars() {
  const rows = summarizeTeamSeasons(activeTeamSeasons()).sort((a, b) => d3.descending(a[state.rankMetric], b[state.rankMetric])).slice(0, 14);
  const { svg, g, width, height, margins } = svgFor("#teamBars", { top: 8, right: 82, bottom: 48, left: 92 });
  const x = d3.scaleLinear().domain([0, d3.max(rows, d => d[state.rankMetric])]).nice().range([0, width]);
  const y = d3.scaleBand().domain(rows.map(d => d.team)).range([0, height]).padding(0.22);
  const meta = metricMeta[state.rankMetric];
  g.selectAll("rect")
    .data(rows)
    .join("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => y(d.team))
    .attr("width", d => x(d[state.rankMetric]))
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("fill", d => d.team === state.team ? colors.red : colors.green)
    .on("pointerenter", (event, d) => showTip(event, `<strong>${d.team}</strong><br>${meta.label}: ${meta.format(d[state.rankMetric])}<br>Games: ${fmtNum(d.games)}`))
    .on("pointermove", (event, d) => showTip(event, `<strong>${d.team}</strong><br>${meta.label}: ${meta.format(d[state.rankMetric])}<br>Games: ${fmtNum(d.games)}`))
    .on("pointerleave", hideTip)
    .on("click", (_, d) => {
      state.team = state.team === d.team ? "All" : d.team;
      els.teamSelect.value = state.team;
      render();
    });
  g.selectAll("text.value")
    .data(rows)
    .join("text")
    .attr("class", "axis-label value-label")
    .attr("x", width + 10)
    .attr("y", d => y(d.team) + y.bandwidth() / 2)
    .attr("dominant-baseline", "middle")
    .text(d => meta.format(d[state.rankMetric]));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(meta.format));
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margins.left + width / 2)
    .attr("y", margins.top + height + 40)
    .attr("text-anchor", "middle")
    .text(meta.label);
}

function drawMarginHist() {
  const games = highlightGames.filter(gameFilter);
  const { svg, g, width, height, margins } = svgFor("#marginHist", { top: 34, right: 18, bottom: 54, left: 54 });
  const bins = d3.bin().domain([0, 60]).thresholds(d3.range(0, 65, 5)).value(d => Math.min(d.margin, 60))(games);
  const x = d3.scaleLinear().domain([0, 60]).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).nice().range([height, 0]);
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", margins.left)
    .attr("y", 16)
    .text("Highlighted Games by Scoring Margin");
  g.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("height", d => height - y(d.length))
    .attr("fill", d => d.x1 <= 5 ? colors.green : colors.indigo)
    .attr("opacity", 0.82);
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margins.left + width / 2)
    .attr("y", margins.top + height + 42)
    .attr("text-anchor", "middle")
    .text("Scoring margin, points");
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margins.top + height / 2))
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .text("Number of games");
}

function drawGameRows() {
  const games = highlightGames.filter(gameFilter)
    .sort((a, b) => d3.ascending(a.winner_prob, b.winner_prob) || d3.descending(a.margin, b.margin))
    .slice(0, 12);
  els.gameRows.innerHTML = "";
  games.forEach(game => {
    const tr = document.createElement("tr");
    const marker = game.upset ? "upset" : (game.margin <= 5 ? "close" : "");
    tr.innerHTML = `
      <td>${game.season}</td>
      <td><strong>${game.winner}</strong> over ${game.loser}${marker ? ` <i class="swatch ${marker}"></i>` : ""}</td>
      <td>${game.winner_pts}-${game.loser_pts}<br><span class="muted">margin ${game.margin}</span></td>
      <td>${fmtPct(game.winner_prob)}</td>
    `;
    els.gameRows.append(tr);
  });
}

function render() {
  if (state.start > state.end) [state.start, state.end] = [state.end, state.start];
  els.start.value = state.start;
  els.end.value = state.end;
  updateStatus();
  updateKpis();
  drawSeasonChart();
  drawEraScatter();
  drawTeamBars();
  drawMarginHist();
  drawGameRows();
}

els.start.addEventListener("input", event => {
  state.start = +event.target.value;
  state.selectedSeason = null;
  render();
});
els.end.addEventListener("input", event => {
  state.end = +event.target.value;
  state.selectedSeason = null;
  render();
});
els.teamSelect.addEventListener("change", event => {
  state.team = event.target.value;
  render();
});
els.rankMetric.addEventListener("change", event => {
  state.rankMetric = event.target.value;
  render();
});
document.querySelector("#resetFilters").addEventListener("click", () => {
  state.start = metadata.first_season;
  state.end = metadata.last_season;
  state.team = "All";
  state.selectedSeason = null;
  els.teamSelect.value = "All";
  render();
});
document.querySelectorAll("[data-season-metric]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-season-metric]").forEach(d => d.classList.remove("active"));
    button.classList.add("active");
    state.seasonMetric = button.dataset.seasonMetric;
    render();
  });
});
window.addEventListener("resize", () => render());

render();
