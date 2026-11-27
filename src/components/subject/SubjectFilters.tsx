import type { DisplayStatus } from "../../utils/statusDisplay";

export type SubjectFilter = "all" | DisplayStatus;

type SubjectFiltersProps = {
  query: string;
  selectedFilter: SubjectFilter;
  counts: Record<DisplayStatus, number>;
  total: number;
  resultCount: number;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: SubjectFilter) => void;
  onClear: () => void;
};

const filters: { value: SubjectFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "available", label: "Disponibles" },
  { value: "in_progress", label: "Cursando" },
  { value: "regular", label: "Debe final" },
  { value: "passed", label: "Aprobadas" },
  { value: "blocked", label: "Bloqueadas" },
];

export default function SubjectFilters({
  query,
  selectedFilter,
  counts,
  total,
  resultCount,
  onQueryChange,
  onFilterChange,
  onClear,
}: SubjectFiltersProps) {
  const hasActiveFilters = query.trim().length > 0 || selectedFilter !== "all";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 w-full items-center gap-2.5 sm:flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 text-zinc-500 transition focus-within:border-[#7B1730] focus-within:ring-4 focus-within:ring-[#7B1730]/5">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <span className="sr-only">Buscar materia por nombre o código</span>

          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por nombre o código"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <p className="text-sm text-zinc-600" aria-live="polite">
              {resultCount} {resultCount === 1 ? "materia" : "materias"}
            </p>

            <button
              type="button"
              onClick={onClear}
              className="h-11 rounded-lg px-2 text-sm font-semibold text-[#7B1730] hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.value;
          const count = filter.value === "all" ? total : counts[filter.value];

          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onFilterChange(filter.value)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {filter.label}
              <span className={isSelected ? "text-white/70" : "text-zinc-400"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
