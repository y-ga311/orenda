import type { SupabaseClient } from "@supabase/supabase-js";
import { getJapanDateKey } from "@/lib/studyRankingPeriod";

type StudySession = {
  duration_minutes: number | null;
  gakusei_id: string | null;
  studied_at: string | null;
};

export type StudyMinutesAggregate = {
  minutesByStudent: Map<string, number>;
  studyDateKeysByStudent: Map<string, Set<string>>;
};

export async function aggregateStudyMinutes(
  supabase: SupabaseClient,
  startIso: string | null,
  endIso: string | null,
): Promise<StudyMinutesAggregate> {
  let sessionsQuery = supabase
    .from("study_sessions")
    .select("gakusei_id, duration_minutes, studied_at");

  if (startIso && endIso) {
    sessionsQuery = sessionsQuery.gte("studied_at", startIso).lt("studied_at", endIso);
  }

  const { data: sessions, error } = await sessionsQuery;

  if (error) {
    throw new Error(error.message);
  }

  const minutesByStudent = new Map<string, number>();
  const studyDateKeysByStudent = new Map<string, Set<string>>();

  ((sessions ?? []) as StudySession[]).forEach((session) => {
    if (!session.gakusei_id || !session.studied_at) {
      return;
    }

    minutesByStudent.set(
      session.gakusei_id,
      (minutesByStudent.get(session.gakusei_id) ?? 0) +
        (session.duration_minutes ?? 0),
    );

    const dateKeys = studyDateKeysByStudent.get(session.gakusei_id) ?? new Set<string>();
    dateKeys.add(getJapanDateKey(session.studied_at));
    studyDateKeysByStudent.set(session.gakusei_id, dateKeys);
  });

  return { minutesByStudent, studyDateKeysByStudent };
}

export function findFirstPlaceStudentIds(minutesByStudent: Map<string, number>): string[] {
  let topMinutes = 0;

  for (const minutes of minutesByStudent.values()) {
    if (minutes > topMinutes) {
      topMinutes = minutes;
    }
  }

  if (topMinutes <= 0) {
    return [];
  }

  return [...minutesByStudent.entries()]
    .filter(([, minutes]) => minutes === topMinutes)
    .map(([studentId]) => studentId);
}
