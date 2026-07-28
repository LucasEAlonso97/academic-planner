export type SubjectStatus =
  | "pending"
  | "in_progress"
  | "regular"
  | "passed";

export interface SubjectProgress {
  subjectId: string;
  status: SubjectStatus;
}