export default function HouseAd({ className = "" }) {
  return (
    <div className={`rounded-lg border p-4 bg-white dark:bg-zinc-900 shadow ${className}`}>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        <div className="font-semibold mb-1">Support Operation: CODE 1983</div>
        <p>Keep this tool free for parents. Sponsor a month or donate.</p>
        <div className="mt-2 flex gap-2">
          <a className="px-3 py-1 rounded border bg-brand-600 text-white hover:bg-brand-700"
             href="https://opencollective.com/operation-code-1983" target="_blank" rel="noreferrer">Sponsor</a>
          <a className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800"
             href="https://buy.stripe.com/test_123" target="_blank" rel="noreferrer">Donate</a>
        </div>
      </div>
    </div>
  );
}