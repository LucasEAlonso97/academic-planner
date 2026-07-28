type LegendItem = {
  label: string;
  description: string;
  dotClassName: string;
  containerClassName: string;
};

const legendItems: LegendItem[] = [
  {
    label: "Aprobada",
    description: "Materia finalizada y aprobada.",
    dotClassName: "bg-green-500",
    containerClassName:
      "border-green-200 bg-green-50 text-green-800",
  },
  {
    label: "Debe final",
    description:
      "Cursada regularizada, pero el final sigue pendiente.",
    dotClassName: "bg-amber-500",
    containerClassName:
      "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    label: "Cursando",
    description: "Materia que estás cursando actualmente.",
    dotClassName: "bg-blue-500",
    containerClassName:
      "border-blue-200 bg-blue-50 text-blue-800",
  },
  {
    label: "Disponible",
    description:
      "Cumple las correlativas y puede comenzar a cursarse.",
    dotClassName: "bg-[#7B1730]",
    containerClassName:
      "border-[#7B1730]/20 bg-[#7B1730]/5 text-[#7B1730]",
  },
  {
    label: "Pendiente",
    description:
      "Materia todavía no iniciada, pero sin bloqueo.",
    dotClassName: "bg-zinc-400",
    containerClassName:
      "border-zinc-200 bg-zinc-50 text-zinc-700",
  },
  {
    label: "Bloqueada",
    description:
      "Todavía no cumple todas las correlativas.",
    dotClassName: "bg-red-500",
    containerClassName:
      "border-red-200 bg-red-50 text-red-800",
  },
];

export default function StatusLegend() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7B1730]">
          Referencias
        </p>

        <h2 className="mt-1 text-xl font-black text-zinc-900">
          Estados de las materias
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Cada color representa la situación académica actual
          de una materia.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {legendItems.map((item) => (
          <article
            key={item.label}
            className={`rounded-2xl border p-4 ${item.containerClassName}`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${item.dotClassName}`}
              />

              <div>
                <h3 className="font-black">
                  {item.label}
                </h3>

                <p className="mt-1 text-xs leading-5 opacity-80">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}