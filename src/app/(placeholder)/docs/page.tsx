import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";

export default function DocsPage() {
  const sections = [
    { id: "getting-started", title: "Getting started", items: ["Overview", "Creating an account", "Roles: Creator, Judge, Organizer"] },
    { id: "contests", title: "Contests", items: ["Contest lifecycle", "Phases and timelines", "Scoring model"] },
    { id: "api", title: "API", items: ["Authentication", "Contests API", "Submissions API"] },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Documentation</h1>
        <p className="mt-2 text-text-secondary">Guides and references for using Ranqly.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
              {s.title}
            </a>
          ))}
        </nav>
        <div className="space-y-8">
          {sections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-semibold text-text-primary">{section.title}</h2>
                <ul className="mt-4 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="text-sm text-text-secondary">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <p className="mt-10">
        <Button variant="ghost" asChild><Link href="/">Back home</Link></Button>
      </p>
    </div>
  );
}
