import { AsciiSkeleton } from "ascii-reveal";

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-hidden="true" data-ascii="skip">
      <div className="filter-panel">
        <div className="filter-header">
          <span className="section-kicker">RAZIŠČI PODATKE</span>
          <span className="skeleton-loading-label">Nalaganje podatkov …</span>
        </div>
        <div className="filter-grid">
          {["Namen uporabe interneta", "Spol", "Izobrazba"].map((label, i) => (
            <div className="select-field skeleton-field" key={label}>
              <span>{label}</span>
              <AsciiSkeleton rows={2} height={42} width="100%" seed={i + 1} />
            </div>
          ))}
        </div>
        <div className="filter-bottom">
          <div className="year-range">
            <span>Obdobje</span>
            <AsciiSkeleton rows={2} width={230} height={34} seed={4} />
          </div>
          <AsciiSkeleton rows={2} width={174} height={36} seed={5} />
        </div>
      </div>

      <div className="selection-caption">
        <span className="status-dot" />
        <AsciiSkeleton lines={1} widths={["100%"]} style={{ width: "40%" }} />
      </div>

      <div className="summary-grid">
        {[
          ["featured", "Zadnja razpoložljiva vrednost"],
          ["", "Sprememba glede na prejšnje leto"],
          ["coverage", "Razpoložljivost v izbranem obdobju"],
        ].map(([className, label], i) => (
          <div className={`stat-card ${className}`} key={label}>
            <span className="stat-label">{label}</span>
            <div className="stat-number">
              <AsciiSkeleton rows={2} width="70%" height="1.25em" seed={i + 6} />
            </div>
            <span>
              <AsciiSkeleton lines={1} widths={["80%"]} seed={i + 9} />
            </span>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <SkeletonChart kind="trend" />
        <SkeletonChart kind="comparison" />
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">03 / ZA GRAFI</span>
            <h2>Številke, leto za letom.</h2>
          </div>
        </div>
        <AsciiSkeleton className="chart-subtitle" lines={1} widths={["60%"]} />
        <div className="skeleton-table">
          {Array.from({ length: 5 }, (_, row) => (
            <div className="skeleton-table-row" key={row}>
              {Array.from({ length: 5 }, (_, column) => (
                <AsciiSkeleton
                  key={column}
                  lines={1}
                  widths={["80%"]}
                  seed={row * 5 + column + 15}
                  animate={false}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonChart({ kind }: { kind: "trend" | "comparison" }) {
  const comparison = kind === "comparison";
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">
            {comparison ? "02 / MED SKUPINAMI" : "01 / SKOZI ČAS"}
          </span>
          <h2>
            {comparison ? "Kdo je bolj povezan?" : "Kako se spreminjajo navade?"}
          </h2>
        </div>
      </div>
      {comparison && (
        <div className="comparison-controls">
          {["Primerjaj po", "Leto primerjave"].map((label, i) => (
            <div className="select-field" key={label}>
              <span>{label}</span>
              <AsciiSkeleton rows={2} width="100%" height={33} seed={i + 40} />
            </div>
          ))}
        </div>
      )}
      <AsciiSkeleton className="chart-subtitle" lines={1} widths={["55%"]} />
      <AsciiSkeleton
        className="chart-canvas skeleton-chart"
        variant="scan"
        rows={16}
        width="100%"
        height="100%"
        seed={comparison ? 13 : 12}
      />
      {comparison && (
        <AsciiSkeleton className="skeleton-group-values" lines={2} seed={14} />
      )}
      <AsciiSkeleton className="chart-footnote" lines={1} widths={["85%"]} />
    </div>
  );
}
