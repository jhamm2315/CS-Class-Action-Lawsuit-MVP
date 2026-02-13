const KpiCard = ({ label, value }) => (
  <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "6px", minWidth: "180px" }}>
    <h4 style={{ margin: 0 }}>{label}</h4>
    <p style={{ fontSize: "1.5rem", margin: 0 }}>{value}</p>
  </div>
);

export default KpiCard;