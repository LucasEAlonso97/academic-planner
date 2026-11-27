// Los tests usan getCareer() directamente: descargamos todas las carreras antes.
import { loadAllCareers } from "../data/career";

await loadAllCareers();
