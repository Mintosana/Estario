import { useMemo, useState } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";

import { propertyTypeLabels, transactionTypeLabels } from "../../constants/listingLabels.js";
import { statusLabels } from "../../constants/statusLabels.js";

ModuleRegistry.registerModules([AllCommunityModule]);

function maxValue(entries) {
  return Math.max(1, ...entries.map(([, count]) => count));
}

function AnalyticsBarChart({ entries, labelFor = (value) => value }) {
  const maximum = maxValue(entries);

  return (
    <div className="analytics-chart-list">
      {entries.map(([label, count]) => (
        <div className="analytics-bar-row" key={label}>
          <div className="analytics-bar-label">
            <span>{labelFor(label)}</span>
            <strong>{count}</strong>
          </div>
          <div className="analytics-bar-track">
            <span style={{ width: `${Math.max(5, (count / maximum) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const timelineMetrics = [
  { key: "listings", label: "Anunturi", color: "#0f4c5c" },
  { key: "messages", label: "Mesaje", color: "#bc6c25" },
  { key: "favorites", label: "Favorite", color: "#6a994e" },
  { key: "users", label: "Utilizatori", color: "#7b2cbf" }
];

const statusColors = {
  APPROVED: "#0f4c5c",
  PENDING: "#bc6c25",
  REJECTED: "#c1121f"
};

const activityPeriods = {
  daily: {
    description: "Evolutia din ultimele 14 zile pentru anunturi, mesaje, favorite si conturi noi.",
    emptyMessage: "Nu exista activitate in ultimele 14 zile.",
    label: "Zilnic",
    title: "Activitate zilnica"
  },
  monthly: {
    description: "Evolutia din ultimele 3 luni pentru anunturi, mesaje, favorite si conturi noi.",
    emptyMessage: "Nu exista activitate in ultimele 3 luni.",
    label: "Lunar",
    title: "Activitate lunara"
  }
};

function ActivityLineChart({ data = [], emptyMessage }) {
  const hasData = data.some((point) => timelineMetrics.some((metric) => (point[metric.key] ?? 0) > 0));
  const options = useMemo(
    () => ({
      axes: [
        {
          label: {
            color: "#516072",
            fontWeight: "bold"
          },
          position: "bottom",
          type: "category"
        },
        {
          label: {
            color: "#667381",
            formatter: ({ value }) => String(Math.round(value))
          },
          min: 0,
          nice: true,
          position: "left",
          type: "number"
        }
      ],
      background: {
        fill: "transparent"
      },
      data,
      legend: {
        item: {
          label: {
            color: "#273442",
            fontSize: 13
          }
        },
        position: "bottom",
        spacing: 18
      },
      padding: {
        bottom: 4,
        left: 8,
        right: 12,
        top: 10
      },
      series: timelineMetrics.map((metric) => ({
        interpolation: {
          type: "smooth"
        },
        marker: {
          enabled: true,
          fill: metric.color,
          size: 7,
          stroke: "#ffffff",
          strokeWidth: 2
        },
        stroke: metric.color,
        strokeWidth: 3,
        type: "line",
        xKey: "label",
        yKey: metric.key,
        yName: metric.label
      })),
      tooltip: {
        enabled: true
      }
    }),
    [data]
  );

  return (
    <div className="analytics-ag-chart-wrap">
      {hasData ? (
        <AgCharts className="analytics-ag-chart" options={options} />
      ) : (
        <div className="analytics-empty-chart">{emptyMessage}</div>
      )}
    </div>
  );
}

function StatusDonutChart({ entries }) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const chartData = entries.map(([status, count]) => ({
    count,
    fill: statusColors[status],
    status: statusLabels[status]
  }));
  const options = useMemo(
    () => ({
      background: {
        fill: "transparent"
      },
      data: chartData,
      legend: {
        item: {
          label: {
            color: "#273442",
            fontSize: 13
          }
        },
        position: "right"
      },
      padding: {
        bottom: 6,
        left: 0,
        right: 0,
        top: 6
      },
      series: [
        {
          angleKey: "count",
          calloutLabelKey: "status",
          fills: chartData.map((item) => item.fill),
          innerLabels: [
            {
              color: "#0f2233",
              fontSize: 28,
              fontWeight: "bold",
              text: String(total)
            },
            {
              color: "#667381",
              fontSize: 13,
              text: "total"
            }
          ],
          innerRadiusRatio: 0.68,
          sectorLabelKey: "count",
          strokes: chartData.map(() => "#ffffff"),
          type: "donut"
        }
      ],
      tooltip: {
        enabled: true
      }
    }),
    [chartData, total]
  );

  return (
    <div className="analytics-ag-donut-wrap">
      {total > 0 ? (
        <AgCharts className="analytics-ag-donut" options={options} />
      ) : (
        <div className="analytics-empty-chart">Nu exista anunturi pentru statusuri.</div>
      )}
    </div>
  );
}

export function AdminAnalyticsDashboard({ analytics }) {
  const [activityPeriod, setActivityPeriod] = useState("daily");
  const statusEntries = Object.entries(analytics.listingsByStatus);
  const selectedPeriod = activityPeriods[activityPeriod];
  const activityData =
    activityPeriod === "daily"
      ? analytics.activityByDay ?? analytics.activityByMonth ?? []
      : analytics.activityByMonth ?? [];

  return (
    <section className="admin-analytics-section" aria-label="Statistici platforma">
      <div className="analytics-grid">
        <article className="analytics-card">
          <span>Utilizatori</span>
          <strong>{analytics.totalUsers}</strong>
          <p>Conturi in platforma</p>
        </article>
        <article className="analytics-card">
          <span>Vizualizari</span>
          <strong>{analytics.totalViews}</strong>
          <p>Total public</p>
        </article>
        <article className="analytics-card">
          <span>Mesaje</span>
          <strong>{analytics.totalMessages}</strong>
          <p>In conversatii</p>
        </article>
        <article className="analytics-card">
          <span>Favorite</span>
          <strong>{analytics.totalFavorites}</strong>
          <p>Anunturi salvate</p>
        </article>
      </div>
      <section className="analytics-panel analytics-panel-wide">
        <div className="analytics-panel-heading">
          <div>
            <h2>{selectedPeriod.title}</h2>
            <p>{selectedPeriod.description}</p>
          </div>
          <div className="analytics-period-toggle" aria-label="Alege perioada pentru grafic">
            {Object.entries(activityPeriods).map(([period, config]) => (
              <button
                className={activityPeriod === period ? "active" : ""}
                key={period}
                onClick={() => setActivityPeriod(period)}
                type="button"
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
        <ActivityLineChart data={activityData} emptyMessage={selectedPeriod.emptyMessage} />
      </section>
      <div className="analytics-breakdown">
        <section className="analytics-panel">
          <h2>Status anunturi</h2>
          <StatusDonutChart entries={statusEntries} />
        </section>
        <section className="analytics-panel">
          <h2>Orase principale</h2>
          <AnalyticsBarChart entries={Object.entries(analytics.listingsByCity)} />
        </section>
        <section className="analytics-panel">
          <h2>Tipuri proprietati</h2>
          <AnalyticsBarChart
            entries={Object.entries(analytics.listingsByPropertyType)}
            labelFor={(type) => propertyTypeLabels[type]}
          />
        </section>
        <section className="analytics-panel">
          <h2>Tip anunt</h2>
          <AnalyticsBarChart
            entries={Object.entries(analytics.listingsByTransactionType)}
            labelFor={(type) => transactionTypeLabels[type]}
          />
        </section>
      </div>
    </section>
  );
}
