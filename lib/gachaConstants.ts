/** ガチャを1回回すときの消費 pt（students.gacha_points から差し引く） */
export const GACHA_SPIN_COST_PT = 100;

/** 学習タイマー終了時に students.gacha_points へ加算するレート（1分あたりの pt） */
export const GACHA_POINTS_PER_STUDY_MINUTE = 1;

/** その日（日本時間）の初回ログイン時に students.gacha_points へ加算する pt */
export const LOGIN_DAILY_BONUS_PT = 10;

/** クエスト正解1問あたりに students.gacha_points へ加算する pt */
export const GACHA_POINTS_PER_QUEST_CORRECT = 1;

/** 週間ランキング1位（先週・月曜起算）への報酬 pt */
export const RANKING_WEEKLY_FIRST_PLACE_PT = 500;

/** 月間ランキング1位（先月）への報酬 pt */
export const RANKING_MONTHLY_FIRST_PLACE_PT = 1000;

/** ランキング報酬の未付与マーカー（1位不在の締め期間） */
export const RANKING_REWARD_NONE_MARKER = "__none__";
