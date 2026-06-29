import type { StaticImageData } from "next/image";
import sanadaImage from "@/source-images/teachar_quest/01sanada.png";
import yamaguchiImage from "@/source-images/teachar_quest/02yamaguchi.png";
import takagiImage from "@/source-images/teachar_quest/03takagi.png";
import yamamotoImage from "@/source-images/teachar_quest/04yamamoto.png";
import imaiImage from "@/source-images/teachar_quest/05imai.png";
import takenakaImage from "@/source-images/teachar_quest/06takenaka.png";
import sakaiImage from "@/source-images/teachar_quest/07sakai.png";
import nakamuraImage from "@/source-images/teachar_quest/08nakamura.png";
import maruyamaImage from "@/source-images/teachar_quest/09maruyama.png";

const TEACHER_SPRITE_BY_CODE: Record<string, StaticImageData> = {
  "01": sanadaImage,
  "02": yamaguchiImage,
  "03": takagiImage,
  "04": yamamotoImage,
  "05": imaiImage,
  "06": takenakaImage,
  "07": sakaiImage,
  "08": nakamuraImage,
  "09": maruyamaImage,
};

/** teacher_quests.teacher_name から画像コードを判定する */
const TEACHER_NAME_ENTRIES: { keywords: string[]; code: string }[] = [
  { keywords: ["真田", "さなだ", "サナダ", "sanada"], code: "01" },
  { keywords: ["山口", "やまぐち", "ヤマグチ", "yamaguchi"], code: "02" },
  { keywords: ["高木", "たかぎ", "タカギ", "takagi"], code: "03" },
  { keywords: ["山本", "やまもと", "ヤマモト", "yamamoto"], code: "04" },
  { keywords: ["今井", "いまい", "イマイ", "imai"], code: "05" },
  { keywords: ["竹中", "たけなか", "タケナカ", "takenaka"], code: "06" },
  { keywords: ["坂井", "さかい", "サカイ", "sakai"], code: "07" },
  { keywords: ["中村", "なかむら", "ナカムラ", "nakamura"], code: "08" },
  { keywords: ["丸山", "まるやま", "マルヤマ", "maruyama"], code: "09" },
];

function normalizeTeacherName(value: string): string {
  return value.normalize("NFKC").trim().replace(/先生/g, "").replace(/\s+/g, "");
}

/**
 * teacher_name カラムの値からスプライトコード (01-09) を返す。
 * 例: "真田先生", "真田 太郎", "yamaguchi" などに対応。
 */
export function resolveTeacherSpriteCodeFromName(
  teacherName: string | null | undefined,
): string | null {
  if (!teacherName?.trim()) {
    return null;
  }

  const raw = teacherName.normalize("NFKC").trim();
  const normalized = normalizeTeacherName(raw);
  const folded = raw.toLowerCase();

  for (const entry of TEACHER_NAME_ENTRIES) {
    const matched = entry.keywords.some((keyword) => {
      const normalizedKeyword = normalizeTeacherName(keyword);
      return (
        raw.includes(keyword) ||
        normalized.includes(normalizedKeyword) ||
        normalized.startsWith(normalizedKeyword) ||
        folded.includes(keyword.toLowerCase())
      );
    });

    if (matched) {
      return entry.code;
    }
  }

  return null;
}

export function getTeacherQuestSprite(teacherName: string | null | undefined): StaticImageData {
  const code = resolveTeacherSpriteCodeFromName(teacherName);
  return (code && TEACHER_SPRITE_BY_CODE[code]) || sanadaImage;
}

export function getTeacherQuestIntroMessage(
  questionIndex: number,
  questionCount: number,
  teacherName: string,
): string {
  if (questionIndex === 0) {
    const displayName = formatTeacherDisplayName(teacherName);
    return `${displayName}がしょうぶをいどんできた！`;
  }

  return `問${questionIndex + 1}／${questionCount}。次の問題だ！`;
}

function formatTeacherDisplayName(teacherName: string): string {
  const trimmed = teacherName.normalize("NFKC").trim();
  if (!trimmed) {
    return "先生";
  }

  if (trimmed.endsWith("先生")) {
    return trimmed;
  }

  return `${trimmed}先生`;
}

export function getTeacherQuestFeedbackMessage(isCorrect: boolean): string {
  return isCorrect ? "正解！よくできた！" : "残念！不正解…";
}
