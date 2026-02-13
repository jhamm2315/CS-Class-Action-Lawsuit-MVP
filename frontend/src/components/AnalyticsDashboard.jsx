import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import KpiCard from "./KpiCard";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("petition_signatures").select("*");

    if (error) {
      console.error("Error fetching data:", error.message);
    } else {
      setData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalSignatures = data.length;

  const unfairDescriptions = data
    .map((item) => item.description || "")
    .filter((desc) => desc.toLowerCase().includes("unfair"));

  const percentCallingUnfair = totalSignatures
    ? ((unfairDescriptions.length / totalSignatures) * 100).toFixed(1)
    : 0;

  const funnelCounts = {
    heard_about: data.filter((item) => item.heard_about).length,
    read_summary: data.filter((item) => item.read_summary).length,
    submitted: totalSignatures,
  };

  const submissionDates = data.map((item) => new Date(item.created_at));
  const earliest = submissionDates.length
    ? new Date(Math.min(...submissionDates))
    : null;
  const latest = submissionDates.length
    ? new Date(Math.max(...submissionDates))
    : null;
  const avgPerDay = (() => {
    if (!earliest || !latest || totalSignatures === 0) return 0;
    const days = (latest - earliest) / (1000 * 60 * 60 * 24);
    return days > 0 ? (totalSignatures / days).toFixed(2) : totalSignatures;
  })();

  const allDescriptions = data.map((item) => item.description || "").join(" ");
  const keywords = {};
  const stopwords = new Set([
    "the", "and", "is", "to", "a", "i", "of", "for", "in", "that", "my",
    "this", "with", "on", "was", "it", "but", "have", "not", "be", "we"
  ]);

  allDescriptions
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .forEach((word) => {
      if (!stopwords.has(word) && word.length > 2) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });

  const sortedKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const movementReadinessScore = Math.min(
    100,
    (percentCallingUnfair / 100) * 70 + (avgPerDay > 1 ? 30 : avgPerDay * 30)
  ).toFixed(1);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📊 Operation CODE 1983 – Analytics Dashboard</h1>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
        <KpiCard label="Total Signatures" value={totalSignatures} />
        <KpiCard label="% Calling It Unfair" value={`${percentCallingUnfair}%`} />
        <KpiCard label="Avg Submissions/Day" value={avgPerDay} />
        <KpiCard label="Movement Readiness Score" value={`${movementReadinessScore}%`} />
        <KpiCard label="Top Keyword" value={sortedKeywords.length ? sortedKeywords[0][0] : "N/A"} />
      </div>

      <h2 style={{ marginTop: "3rem" }}>🧠 Top Keywords</h2>
      <ul>
        {sortedKeywords.map(([word, count]) => (
          <li key={word}>
            <strong>{word}</strong>: {count} mentions
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "3rem" }}>🔁 Funnel Stats</h2>
      <ul>
        <li>Heard About: {funnelCounts.heard_about}</li>
        <li>Read Summary: {funnelCounts.read_summary}</li>
        <li>Submitted: {funnelCounts.submitted}</li>
      </ul>

      <h2 style={{ marginTop: "3rem" }}>📅 Submission Timeline</h2>
      <p>
        Earliest: {earliest?.toLocaleDateString() || "N/A"} | Latest:{" "}
        {latest?.toLocaleDateString() || "N/A"}
      </p>
    </div>
  );
};

export default AnalyticsDashboard;