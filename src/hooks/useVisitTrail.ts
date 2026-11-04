import { useCallback, useEffect, useState } from "react";

export type VisitedPath = "/work" | "/studio" | "/about";
const storageKey = "ap-visit-trail-v1";

function isVisitedPath(value: unknown): value is VisitedPath {
  return value === "/work" || value === "/studio" || value === "/about";
}

function readVisits(): VisitedPath[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter(isVisitedPath))] : [];
  } catch {
    return [];
  }
}

/** Actual main-page exploration in this tab; never an analytics signal or score. */
export default function useVisitTrail(route: string) {
  const [visitedPaths, setVisitedPaths] = useState<VisitedPath[]>(readVisits);

  useEffect(() => {
    // App already normalizes the pathname. Cases, Home and 404s add no visits.
    if (!isVisitedPath(route)) return;
    setVisitedPaths((current) => current.includes(route) ? current : [...current, route]);
  }, [route]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(visitedPaths));
    } catch {
      // Optional browser storage must not interrupt exploration or reset.
    }
  }, [visitedPaths]);

  const resetVisits = useCallback(() => setVisitedPaths([]), []);
  return { visitedPaths, resetVisits };
}
