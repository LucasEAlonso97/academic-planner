type StatCardProps = {
  label: string;
  value: number;
  featured?: boolean;
};

export default function StatCard({ label, value, featured = false }: StatCardProps) {
  return (
    <article
      className={
        featured
          ? "rounded-2xl bg-[#7B1730] p-6 text-white shadow-sm"
          : "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      }
    >
      <p className={featured ? "text-sm text-white/75" : "text-sm text-zinc-500"}>
        {label}
      </p>
      <strong className="mt-3 block text-4xl font-black">{value}</strong>
    </article>
  );
}