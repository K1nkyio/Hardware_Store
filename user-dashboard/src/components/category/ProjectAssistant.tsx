type FilterState = {
  q: string;
  productType: string;
  compatibility: string;
  pickupCity: string;
  availability: "any" | "in-stock" | "out-of-stock";
  priceMin: string;
  priceMax: string;
  sortBy: string;
};

const guidedModes: Array<{ title: string; description: string; filters: Partial<FilterState> }> = [
  {
    title: "Electrical fit-out",
    description: "Bias toward breakers, conduit, and lighting-ready supplies.",
    filters: { q: "breaker", compatibility: "conduit", sortBy: "featured" },
  },
  {
    title: "Plumbing repair",
    description: "Surface fittings, sealants, and branch-pickup stock for urgent jobs.",
    filters: { q: "PVC", pickupCity: "Nairobi", availability: "in-stock" },
  },
  {
    title: "Site safety setup",
    description: "Focus on PPE, signage, and low-friction replenishment items.",
    filters: { q: "safety", availability: "in-stock", sortBy: "newest" },
  },
];

interface ProjectAssistantProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const ProjectAssistant = ({ filters, onApply }: ProjectAssistantProps) => (
  <section className="px-4 pb-8 sm:px-6">
    <div className="border border-border bg-muted/20 p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Guided Selection</p>
        <h2 className="text-xl font-light text-foreground">Need a faster starting point?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use one of these project modes to pre-shape search, compatibility, and pickup filters.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {guidedModes.map((mode) => (
          <button
            key={mode.title}
            className="border border-border bg-background px-4 py-4 text-left transition-colors hover:border-foreground"
            onClick={() => onApply({ ...filters, ...mode.filters })}
          >
            <p className="text-sm font-medium text-foreground">{mode.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{mode.description}</p>
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default ProjectAssistant;
