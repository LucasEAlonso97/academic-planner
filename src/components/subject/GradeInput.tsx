import { useState } from "react";

import { formatGrade, parseGrade } from "../../utils/grades";
import { MAX_GRADE, MIN_GRADE } from "../../utils/progressValidation";

type GradeInputProps = {
  subjectName: string;
  grade: number | undefined;
  onChange: (grade: number | null) => void;
};

/**
 * Campo de nota. Guarda al salir del campo o con Enter.
 * El padre lo monta con `key={grade}` para que se resetee
 * si la nota cambia desde afuera (por ejemplo, al deshacer).
 */
export default function GradeInput({ subjectName, grade, onChange }: GradeInputProps) {
  const [text, setText] = useState(grade === undefined ? "" : formatGrade(grade));

  const parsed = parseGrade(text);
  const isEmpty = text.trim() === "";
  const isInvalid = !isEmpty && (parsed === null || parsed < MIN_GRADE || parsed > MAX_GRADE);

  const commit = () => {
    if (isEmpty) {
      if (grade !== undefined) onChange(null);
      return;
    }

    if (!isInvalid && parsed !== grade) {
      onChange(parsed);
    }
  };

  return (
    <label className="relative block">
      <span className="sr-only">Nota de {subjectName}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="Nota"
        value={text}
        aria-invalid={isInvalid}
        title={isInvalid ? `La nota tiene que estar entre ${MIN_GRADE} y ${MAX_GRADE}` : undefined}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={`h-9 w-[60px] rounded-lg border bg-white px-2 text-center text-[13px] font-semibold tabular-nums text-zinc-900 outline-none transition placeholder:font-medium placeholder:text-zinc-400 focus:ring-2 ${
          isInvalid
            ? "border-red-400 focus:ring-red-200"
            : "border-zinc-200 focus:border-[#7B1730] focus:ring-[#7B1730]/15"
        }`}
      />
    </label>
  );
}
