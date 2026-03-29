import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";

export default function ApiPage() {
  const endpoints = [
    { method: "GET", path: "/v1/contests", description: "List contests" },
    { method: "GET", path: "/v1/contests/:id", description: "Get contest details" },
    { method: "POST", path: "/v1/contests/:id/submissions", description: "Submit an entry" },
    { method: "GET", path: "/v1/submissions", description: "List user submissions" },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">API</h1>
        <p className="mt-2 text-text-secondary">Programmatic access to Ranqly. API keys and full reference coming soon.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display font-semibold text-text-primary">Endpoints</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-tertiary">
                  <th className="pb-3 pr-4 font-medium">Method</th>
                  <th className="pb-3 pr-4 font-medium">Path</th>
                  <th className="pb-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={ep.path} className="border-b border-border-subtle/50">
                    <td className="py-3 pr-4"><span className="rounded bg-primary-500/15 px-2 py-0.5 text-xs font-medium text-primary-400">{ep.method}</span></td>
                    <td className="py-3 pr-4 font-mono text-text-primary">{ep.path}</td>
                    <td className="py-3 text-text-secondary">{ep.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="mt-10">
        <Button variant="ghost" asChild><Link href="/">Back home</Link></Button>
      </p>
    </div>
  );
}
