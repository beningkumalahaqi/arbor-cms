import { getAllPageTypes } from "@/lib/page-types";
import { PageLayout } from "@/components/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";

export default function PageTypesPage() {
  const pageTypes = getAllPageTypes();

  return (
    <PageLayout
      title="Page Types"
      description="Registered page types available in the system."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {pageTypes.map((pt) => (
          <Card key={pt.name}>
            <CardHeader>
              <CardTitle>{pt.label}</CardTitle>
              <CardDescription>{pt.description}</CardDescription>
            </CardHeader>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Properties
              </p>
              <ul className="space-y-1">
                {pt.allowedProperties.map((prop) => (
                  <li
                    key={prop.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {prop.label}
                    </span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {prop.type}
                      {prop.required ? " • required" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
