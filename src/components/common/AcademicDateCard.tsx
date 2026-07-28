import { getAcademicCalendar } from "../../utils/academicCalendar";

export default function AcademicDateCard() {
  const academicCalendar = getAcademicCalendar();

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-[#7B1730]/15 bg-white shadow-sm">
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7B1730]">
            Fecha académica
          </p>

          <h2 className="mt-2 text-2xl font-black text-zinc-900">
            {academicCalendar.periodName}
          </h2>

          <p className="mt-2 text-sm text-zinc-600">
            {academicCalendar.periodDescription}
          </p>

          <p className="mt-4 text-sm font-semibold text-zinc-800">
            Hoy · {academicCalendar.formattedDate}
          </p>
        </div>

        <div className="border-t border-[#7B1730]/10 bg-[#7B1730]/5 p-6 md:min-w-64 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7B1730]">
            Próximo período
          </p>

          <p className="mt-2 font-black text-zinc-900">
            {academicCalendar.nextPeriod}
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            La fecha se actualiza automáticamente cada año.
          </p>
        </div>
      </div>
    </section>
  );
}