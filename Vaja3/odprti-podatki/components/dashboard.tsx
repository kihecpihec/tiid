"use client";

import { useEffect, useMemo, useState } from "react";
import { AsciiReveal } from "ascii-reveal";
import type { Dataset, Dimension } from "@/lib/px/types";
import {
  derivePoint,
  indexObservations,
  latestSummary,
  type Mode,
} from "@/lib/analysis";
import { ComparisonChart, formatValue, TrendChart } from "./dashboard-charts";
import { SelectField, ViewToggle } from "./dashboard-filters";
import { DatasetNotes } from "./dataset-notes";
import { DashboardSkeleton } from "./dashboard-skeleton";

function getDimension(data: Dataset, name: string): Dimension {
  const dimension = data.dimensions.find((d) => d.name === name);
  if (!dimension) throw new Error(`Manjka dimenzija ${name}.`);
  return dimension;
}

export function Dashboard() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; data: Dataset }
  >({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/data", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Podatkov ni bilo mogoče naložiti.");
        if (
          !Array.isArray(body.dimensions) ||
          !Array.isArray(body.observations) ||
          !body.metadata
        )
          throw new Error("Neveljaven odgovor podatkovnega vira.");
        setState({ status: "ready", data: body });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Napaka pri nalaganju.",
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  function refresh() {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  }
  if (state.status === "error")
    return (
      <div className="state-panel" role="alert">
        <h2>Podatki trenutno niso na voljo.</h2>
        <p>{state.message}</p>
        <button className="outline-button" onClick={refresh}>
          Poskusi znova
        </button>
      </div>
    );
  return (
    <>
      <p className="sr-only" role="status">
        {state.status === "loading"
          ? "Beremo podatke, povezujemo zgodbo. Nalaganje izvorne datoteke PC-Axis …"
          : "Podatki so naloženi."}
      </p>
      <AsciiReveal
        className="dashboard-reveal"
        loading={state.status === "loading"}
        preset="decode"
        duration="fast"
        origin="top-left"
        revealOnMount={false}
        shimmer={false}
        selector=".selection-caption, .summary-grid, .panel-heading, .chart-subtitle, .group-values, .table-scroll"
      >
        {state.status === "loading" ? (
          <DashboardSkeleton />
        ) : (
          <LoadedDashboard key={attempt} data={state.data} refresh={refresh} />
        )}
      </AsciiReveal>
    </>
  );
}

function LoadedDashboard({
  data,
  refresh,
}: {
  data: Dataset;
  refresh: () => void;
}) {
  const years = getDimension(data, "LETO")
    .categories.map((c) => Number(c.code))
    .sort((a, b) => a - b);
  const purposes = getDimension(data, "NAMEN UPORABE INTERNETA").categories;
  const sexes = getDimension(data, "SPOL").categories;
  const educations = getDimension(data, "IZOBRAZBA").categories;
  const defaultPurpose =
    ["STAT810", "STAT999", "STAT815"].find((code) =>
      data.observations.some((r) => r.purposeCode === code && r.value !== null),
    ) ?? purposes[0].code;
  const [purpose, setPurpose] = useState(defaultPurpose);
  const [sex, setSex] = useState(sexes[0].code);
  const [education, setEducation] = useState(educations[0].code);
  const [from, setFrom] = useState(years[0]);
  const [to, setTo] = useState(years.at(-1)!);
  const [mode, setMode] = useState<Mode>("count");
  const [compareBy, setCompareBy] = useState<"sex" | "education">("sex");
  const index = useMemo(() => indexObservations(data), [data]);
  const allPoints = years.map((year) =>
    derivePoint(index, year, purpose, sex, education, mode),
  );
  const points = allPoints.filter((p) => p.year >= from && p.year <= to);
  const yearOptions = years.map((year) => ({
    value: String(year),
    label: String(year),
  }));
  const { latest, change } = latestSummary(points);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const comparisonYear =
    chosenYear !== null && chosenYear >= from && chosenYear <= to
      ? chosenYear
      : (latest?.year ?? to);
  const comparisonCategories =
    compareBy === "sex" ? sexes.slice(1) : educations.slice(1);
  const groups = comparisonCategories.map((c, i) => {
    const p = derivePoint(
      index,
      comparisonYear,
      purpose,
      compareBy === "sex" ? c.code : sex,
      compareBy === "education" ? c.code : education,
      mode,
    );
    return {
      name:
        compareBy === "sex"
          ? c.label
          : (["Osnovna ali manj", "Srednja", "Višja ali več"][i] ?? c.label),
      label: c.label,
      value: p.value,
      reason: p.reason,
      annotations: [
        ...(p.raw?.annotations ?? []),
        ...(mode === "percent" ? (p.denominator?.annotations ?? []) : []),
      ],
    };
  });
  const category = purposes.find((c) => c.code === purpose)!;
  const missing = points.filter((p) => p.value === null).length;
  const activeSex = sexes.find((c) => c.code === sex)?.label;
  const activeEducation = educations.find((c) => c.code === education)?.label;
  return (
    <>
      <section className="filter-panel" aria-label="Filtri podatkov">
        <div className="filter-header">
          <span className="section-kicker">RAZIŠČI PODATKE</span>
          <button className="text-button" onClick={refresh}>
            ↻ Osveži iz datoteke
          </button>
        </div>
        <div className="filter-grid">
          <SelectField
            label="Namen uporabe interneta"
            value={purpose}
            onChange={setPurpose}
            options={purposes.map((c) => ({ value: c.code, label: c.label }))}
          />
          <SelectField
            label="Spol"
            value={sex}
            onChange={setSex}
            options={sexes.map((c) => ({ value: c.code, label: c.label }))}
          />
          <SelectField
            label="Izobrazba"
            value={education}
            onChange={setEducation}
            options={educations.map((c) => ({ value: c.code, label: c.label }))}
          />
        </div>
        <div className="filter-bottom">
          <div className="year-range">
            <span>Obdobje</span>
            <SelectField
              label="Od leta"
              value={from}
              onChange={(v) => {
                const n = Number(v);
                setFrom(n);
                if (n > to) setTo(n);
              }}
              options={yearOptions}
            />
            <span aria-hidden="true">—</span>
            <SelectField
              label="Do leta"
              value={to}
              onChange={(v) => {
                const n = Number(v);
                setTo(n);
                if (n < from) setFrom(n);
              }}
              options={yearOptions}
            />
          </div>
          <ViewToggle mode={mode} onChange={setMode} />
        </div>
      </section>
      <div className="selection-caption">
        <span className="status-dot" />
        <span>{category.label}</span>
        <code>{purpose}</code>
      </div>
      <section
        className="summary-grid"
        aria-label="Povzetek izbire"
        aria-live="polite"
      >
        <article className="stat-card featured">
          <span className="stat-label">Zadnja razpoložljiva vrednost</span>
          <strong className="stat-number">
            {formatValue(latest?.value, mode)}
          </strong>
          <span>
            {latest
              ? `Leto ${latest.year} · ${mode === "count" ? "posameznikov" : "prebivalstva STAT2"}`
              : "Za to izbiro ni podatkov"}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Sprememba glede na prejšnje leto</span>
          <strong className="stat-number change">
            {change === null
              ? "—"
              : `${change > 0 ? "+" : ""}${formatValue(change, "count")}${mode === "percent" ? " o. t." : ""}`}
          </strong>
          <span>
            {change !== null && latest
              ? `${latest.year - 1} → ${latest.year} · ${mode === "count" ? "posameznikov" : "odstotne točke"}`
              : "Potrebni sta dve zaporedni veljavni leti"}
          </span>
        </article>
        <article className="stat-card coverage">
          <span className="stat-label">Razpoložljivost v izbranem obdobju</span>
          <strong className="stat-number">
            {points.length - missing}
            <small> / {points.length}</small>
          </strong>
          <span>
            let z veljavno vrednostjo
            {missing > 0
              ? ` · ${missing} brez podatka`
              : " · celotna časovna vrsta"}
          </span>
        </article>
      </section>
      {mode === "percent" && (
        <p className="notice">
          Osnova deleža: prebivalstvo, staro 16–74 let (STAT2), za isto leto,
          spol in izobrazbo. Delež ni izračunan med uporabniki interneta.
        </p>
      )}
      <div className="chart-grid">
        <section className="panel" aria-labelledby="trend-title">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">01 / SKOZI ČAS</span>
              <h2 id="trend-title">Kako se spreminjajo navade?</h2>
            </div>
            <span className="unit-tag">
              {mode === "count" ? data.metadata.units : "% prebivalstva"}
            </span>
          </div>
          <p className="chart-subtitle">
            {activeSex} · {activeEducation}
          </p>
          {latest ? (
            <div
              role="img"
              aria-label={`Časovni potek od ${from} do ${to}. Vrednosti so v spodnji tabeli.`}
            >
              <TrendChart points={points} mode={mode} />
            </div>
          ) : (
            <EmptyState />
          )}
          <p className="chart-footnote">
            <span className="legend-line" />
            Izbrana skupina <span>Manjkajoče vrednosti prekinjajo črto.</span>
          </p>
        </section>
        <section className="panel" aria-labelledby="comparison-title">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">02 / MED SKUPINAMI</span>
              <h2 id="comparison-title">Kdo je bolj povezan?</h2>
            </div>
          </div>
          <div className="comparison-controls">
            <SelectField
              label="Primerjaj po"
              value={compareBy}
              onChange={(v) => setCompareBy(v === "sex" ? "sex" : "education")}
              options={[
                { value: "sex", label: "Spolu" },
                { value: "education", label: "Izobrazbi" },
              ]}
            />
            <SelectField
              label="Leto primerjave"
              value={comparisonYear}
              onChange={(v) => setChosenYear(Number(v))}
              options={points.map((p) => ({
                value: String(p.year),
                label: String(p.year),
              }))}
            />
          </div>
          <p className="chart-subtitle">
            {compareBy === "sex" ? activeEducation : activeSex} ·{" "}
            {mode === "count" ? data.metadata.units : "% prebivalstva"}
          </p>
          {groups.some((g) => g.value !== null) ? (
            <div
              role="img"
              aria-label="Primerjava skupin. Vrednosti so izpisane pod grafom."
            >
              <ComparisonChart groups={groups} mode={mode} />
            </div>
          ) : (
            <EmptyState />
          )}
          <ul className="group-values">
            {groups.map((g) => (
              <li key={g.label}>
                <span>{g.label}</span>
                <strong>
                  {g.reason ?? formatValue(g.value, mode)}
                  {g.annotations.length > 0 && (
                    <small> · oznaka {g.annotations.join(", ")}</small>
                  )}
                </strong>
              </li>
            ))}
          </ul>
          <p className="chart-footnote">
            Skupna vrednost je izključena iz primerjave; skupin ne seštevamo.
          </p>
        </section>
      </div>
      <section className="panel table-panel" aria-labelledby="table-title">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">03 / ZA GRAFI</span>
            <h2 id="table-title">Številke, leto za letom.</h2>
          </div>
          <span className="unit-tag">{points.length} let</span>
        </div>
        <p className="chart-subtitle">
          {category.label} · {activeSex} · {activeEducation}
        </p>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Vrednosti izbrane skupine in osnova za izračun deleža
            </caption>
            <thead>
              <tr>
                <th scope="col">Leto</th>
                <th scope="col">Število posameznikov</th>
                <th scope="col">Prebivalstvo (STAT2)</th>
                <th scope="col">
                  {mode === "percent"
                    ? "Delež prebivalstva"
                    : "Prikazana vrednost"}
                </th>
                <th scope="col">Opombe / stanje</th>
              </tr>
            </thead>
            <tbody>
              {points.toReversed().map((p) => (
                <tr key={p.year}>
                  <th scope="row">{p.year}</th>
                  <td>
                    {p.raw?.value === null
                      ? p.raw.marker
                      : formatValue(p.raw?.value, "count")}
                  </td>
                  <td>
                    {p.denominator?.value === null
                      ? p.denominator.marker
                      : formatValue(p.denominator?.value, "count")}
                  </td>
                  <td>{formatValue(p.value, mode)}</td>
                  <td>
                    {[
                      p.reason,
                      ...(p.raw?.annotations.map((a) => `Oznaka: ${a}`) ?? []),
                      ...(p.denominator?.annotations.map(
                        (a) => `Osnova STAT2: ${a}`,
                      ) ?? []),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <DatasetNotes
        data={data}
        purpose={purpose}
        sex={sex}
        education={education}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="empty-state" role="status">
      <span aria-hidden="true">∅</span>
      <strong>Za izbrane filtre ni podatkov.</strong>
      <p>Izberite drugo leto, kategorijo ali skupino.</p>
    </div>
  );
}
