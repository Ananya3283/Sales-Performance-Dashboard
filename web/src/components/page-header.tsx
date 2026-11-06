/** Top line on every dashboard: the project name, the dataset, and where the code lives. */
export function PageHeader({ title, dataset, repo, linkText = "Code on GitHub" }: { title: string; dataset: string; repo: string; linkText?: string }) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-8">
      <p className="font-bold">
        <a href="https://ananya3283.github.io" className="text-muted-foreground hover:text-foreground">
          Ananya Rawat
        </a>
        <span className="px-2 text-muted-foreground">/</span>
        {title}
      </p>
      <p className="text-sm text-muted-foreground">
        {dataset}{" "}
        <a className="font-semibold text-foreground underline underline-offset-4 hover:text-kept" href={repo}>
          {linkText}
        </a>
      </p>
    </header>
  )
}
