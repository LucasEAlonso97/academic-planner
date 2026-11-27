export interface CareerInfo {
  id: string;
  name: string;
  plan: string;
  years: number;
}

export interface AcademicSubject {
  id: string;
  code: number;
  name: string;
  year: 1 | 2 | 3;
  semester: 1 | 2;
  hours: number;
  prerequisites: string[];
}

export interface CareerData {
  career: CareerInfo;
  subjects: AcademicSubject[];
}