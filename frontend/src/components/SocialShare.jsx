export default function SocialShare({ title = "Operation: CODE 1983", url = typeof location !== "undefined" ? location.href : "" }) {
  const u = encodeURIComponent(url); const t = encodeURIComponent(title);
  return (
    <div className="flex gap-2">
      <a className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800" target="_blank" rel="noreferrer"
         href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}>Share on X</a>
      <a className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800" target="_blank" rel="noreferrer"
         href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}>Share on LinkedIn</a>
      <a className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800" target="_blank" rel="noreferrer"
         href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}>Share on Facebook</a>
    </div>
  );
}