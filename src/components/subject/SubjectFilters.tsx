export type SubjectFilter =
  | "all"
  | "available"
  | "blocked"
  | "pending"
  | "in_progress"
  | "regular"
  | "passed";

type SubjectFiltersProps = {
  query: string;
  selectedFilter: SubjectFilter;
  resultCount: number;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: SubjectFilter) => void;
  onClear: () => void;
};

const filters: Array<{
  value: SubjectFilter;
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: "available", label: "Disponibles" },
  { value: "blocked", label: "Bloqueadas" },
  { value: "pending", label: "Pendientes" },
  { value: "in_progress", label: "Cursando" },
  { value: "regular", label: "Debe final" },
  { value: "passed", label: "Aprobadas" },
];

export default function SubjectFilters({
  query,
  selectedFilter,
  resultCount,
  onQueryChange,
  onFilterChange,
  onClear,
}: SubjectFiltersProps) {
  const hasActiveFilters =
    query.trim().length > 0 || selectedFilter !== "all";

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex-1">
            <span className="sr-only">
              Buscar materia por nombre o código
            </span>

            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#7B1730] focus:bg-white focus:ring-4 focus:ring-[#7B1730]/5"
            />
          </label>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <p className="text-sm font-semibold text-zinc-500">
              {resultCount}{" "}
              {resultCount === 1 ? "materia encontrada" : "materias encontradas"}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-bold text-[#7B1730] hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onFilterChange(filter.value)}
                className={
                  isSelected
                    ? "rounded-full border border-[#7B1730] bg-[#7B1730] px-4 py-2 text-xs font-bold text-white"
                    : "rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-600 transition hover:border-[#7B1730]/30 hover:bg-[#7B1730]/5 hover:text-[#7B1730]"
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}