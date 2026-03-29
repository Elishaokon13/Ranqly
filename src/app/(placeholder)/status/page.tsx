import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";

export default function StatusPage() {
  const services = [
    { name: "API", status: "Operational" },
    { name: "Web app", status: "Operational" },
    { name: "Auth", status: "Operational" },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">System status</h1>
        <p className="mt-2 text-text-secondary">Current status of Ranqly services.</p>
      </div>
      <div className="space-y-4">
        {services.map((s) => (
          <Card key={s.name}>
            <CardContent className="flex items-center justify-between p-5">
              <span className="font-medium text-text-primary">{s.name}</span>
              <span className="flex items-center gap-2 text-sm text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                {s.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="font-display font-semibold text-text-primary">Incident history</h2>
          <p className="mt-2 text-sm text-text-tertiary">No incidents in the past 90 days.</p>
        </CardContent>
      </Card>
      <p className="mt-10">
        <Button variant="ghost" asChild><Link href="/">Back home</Link></Button>
      </p>
    </div>
  );
}
