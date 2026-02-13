import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    total_signatures: 0,
    unfair_count: 0,
    join_count: 0,
    contact_count: 0,
    avg_word_count: 0,
    avg_token_count: 0,
    weekly_count: 0,
  });

  const fetchMetrics = async () => {
    // Total Signatures
    const { count: total } = await supabase
      .from('petition_signatures')
      .select('*', { count: 'exact', head: true });

      // Weekly Submission Rate
const { data: allSignatures } = await supabase
  .from('petition_signatures')
  .select('timestamp');

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const weeklySubmissions = allSignatures.filter(entry => 
  new Date(entry.timestamp) >= oneWeekAgo
);

    // Unfair Treatment
    const { count: unfair } = await supabase
      .from('petition_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('experienced_unfairness', true);

    // Interested in Joining
    const { count: join } = await supabase
      .from('petition_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('interested_in_joining', 'Yes');

    // Consent to Contact
    const { count: contact } = await supabase
      .from('petition_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('consent_to_contact', true);

    // Averages
    const { data: avgData } = await supabase.rpc('get_averages');

    setMetrics({
      total_signatures: total || 0,
      unfair_count: unfair || 0,
      join_count: join || 0,
      contact_count: contact || 0,
      avg_word_count: Math.round(avgData?.avg_word_count) || 0,
      avg_token_count: Math.round(avgData?.avg_token_estimate) || 0,
      weekly_count: weeklySubmissions.length || 0,
    });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">⚖️ Real-Time Accountability Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="📝 Total Signatures" value={metrics.total_signatures} />
        <MetricCard title="🚫 Unfair Treatment Reported" value={metrics.unfair_count} />
        <MetricCard title="🤝 Interested in Joining" value={metrics.join_count} />
        <MetricCard title="📞 Gave Consent to Contact" value={metrics.contact_count} />
        <MetricCard title="🧠 Avg. Word Count" value={metrics.avg_word_count} />
        <MetricCard title="🔢 Avg. Token Estimate" value={metrics.avg_token_count} />
        <MetricCard title="📅 Signatures This Week" value={metrics.weekly_count} />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

export default Dashboard;