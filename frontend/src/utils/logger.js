export function logAction(event, description) {
  const log = {
    timestamp: new Date().toISOString(),
    event,
    description,
  };

  // Store in localStorage
  const existingLogs = JSON.parse(localStorage.getItem('audit_log') || '[]');
  existingLogs.push(log);
  localStorage.setItem('audit_log', JSON.stringify(existingLogs));

  // Optionally: Supabase push
  // You can wire this to your Supabase logs table later
  // Example:
  // supabase.from('audit_log').insert([log]);

  console.log("Audit log recorded:", log);
}