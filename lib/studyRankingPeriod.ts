export type RankingPeriod = "week" | "month" | "year" | "total";

export type JapanDateParts = {
  year: number;
  month: number;
  day: number;
};

export type PeriodRange = {
  startIso: string | null;
  endIso: string | null;
};

export type ClosedRankingPeriod = {
  periodType: "week" | "month";
  periodKey: string;
  startIso: string;
  endIso: string;
};

export function getJapanDateParts(date = new Date()): JapanDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);

  return { year, month, day };
}

export function getJapanBoundaryIso(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - 9 * 60 * 60 * 1000).toISOString();
}

export function addDaysToJapanDate(
  year: number,
  month: number,
  day: number,
  offset: number,
): JapanDateParts {
  const date = new Date(Date.UTC(year, month - 1, day + offset));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function formatJapanDateKey(parts: JapanDateParts): string {
  return `${parts.year}-${parts.month.toString().padStart(2, "0")}-${parts.day
    .toString()
    .padStart(2, "0")}`;
}

export function formatMonthPeriodKey(parts: Pick<JapanDateParts, "year" | "month">) {
  return `${parts.year}-${parts.month.toString().padStart(2, "0")}`;
}

function getCurrentWeekStart(today: JapanDateParts): JapanDateParts {
  const dayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();

  return addDaysToJapanDate(
    today.year,
    today.month,
    today.day,
    -((dayOfWeek + 6) % 7),
  );
}

export function getPeriodRange(
  period: RankingPeriod,
  referenceDate = new Date(),
): PeriodRange {
  const today = getJapanDateParts(referenceDate);
  const weekStart = getCurrentWeekStart(today);
  const weekEnd = addDaysToJapanDate(weekStart.year, weekStart.month, weekStart.day, 7);
  const nextMonth =
    today.month === 12
      ? { year: today.year + 1, month: 1, day: 1 }
      : { year: today.year, month: today.month + 1, day: 1 };
  const nextYear = { year: today.year + 1, month: 1, day: 1 };

  return {
    week: {
      startIso: getJapanBoundaryIso(weekStart.year, weekStart.month, weekStart.day),
      endIso: getJapanBoundaryIso(weekEnd.year, weekEnd.month, weekEnd.day),
    },
    month: {
      startIso: getJapanBoundaryIso(today.year, today.month, 1),
      endIso: getJapanBoundaryIso(nextMonth.year, nextMonth.month, nextMonth.day),
    },
    year: {
      startIso: getJapanBoundaryIso(today.year, 1, 1),
      endIso: getJapanBoundaryIso(nextYear.year, nextYear.month, nextYear.day),
    },
    total: { startIso: null, endIso: null },
  }[period];
}

export function getLastCompletedWeekPeriod(
  referenceDate = new Date(),
): ClosedRankingPeriod {
  const today = getJapanDateParts(referenceDate);
  const currentWeekStart = getCurrentWeekStart(today);
  const lastWeekStart = addDaysToJapanDate(
    currentWeekStart.year,
    currentWeekStart.month,
    currentWeekStart.day,
    -7,
  );

  return {
    periodType: "week",
    periodKey: formatJapanDateKey(lastWeekStart),
    startIso: getJapanBoundaryIso(lastWeekStart.year, lastWeekStart.month, lastWeekStart.day),
    endIso: getJapanBoundaryIso(
      currentWeekStart.year,
      currentWeekStart.month,
      currentWeekStart.day,
    ),
  };
}

export function getLastCompletedMonthPeriod(
  referenceDate = new Date(),
): ClosedRankingPeriod {
  const today = getJapanDateParts(referenceDate);
  const currentMonthStart = { year: today.year, month: today.month, day: 1 };
  const lastMonth =
    today.month === 1
      ? { year: today.year - 1, month: 12, day: 1 }
      : { year: today.year, month: today.month - 1, day: 1 };

  return {
    periodType: "month",
    periodKey: formatMonthPeriodKey(lastMonth),
    startIso: getJapanBoundaryIso(lastMonth.year, lastMonth.month, lastMonth.day),
    endIso: getJapanBoundaryIso(
      currentMonthStart.year,
      currentMonthStart.month,
      currentMonthStart.day,
    ),
  };
}

export function getJapanDateKey(dateIso: string) {
  return formatJapanDateKey(getJapanDateParts(new Date(dateIso)));
}
