export type QuestSubcategory = {
  id: string;
  label: string;
};

/** 科目分類.pdf に基づく中分類（Supabase 連携前の静的データ） */
const questSubcategoriesBySubject: Record<string, QuestSubcategory[]> = {
  iryogairon: [
    { id: "iryogairon-society", label: "医療と社会" },
    { id: "iryogairon-security", label: "社会保障制度" },
    { id: "iryogairon-ethics", label: "医療倫理" },
  ],
  eisei: [
    { id: "eisei-meaning", label: "衛生・公衆衛生学の意義" },
    { id: "eisei-prevention", label: "健康の保持増進と疾病予防" },
    { id: "eisei-lifestyle", label: "ライフスタイルと健康" },
    { id: "eisei-environment", label: "環境と健康" },
    { id: "eisei-industrial", label: "産業衛生管理" },
    { id: "eisei-mental", label: "精神保健" },
    { id: "eisei-maternal", label: "母子保健" },
    { id: "eisei-adult-elderly", label: "成人・高齢者保健" },
    { id: "eisei-infection", label: "感染症対策" },
    { id: "eisei-disinfection", label: "消毒" },
    { id: "eisei-epidemiology", label: "疫学" },
    { id: "eisei-statistics", label: "保健統計" },
    { id: "eisei-international", label: "国際保健" },
    { id: "eisei-school", label: "学校保健" },
  ],
  kankeihouki: [
    { id: "kankeihouki-license", label: "あはき法における免許" },
    { id: "kankeihouki-work", label: "あはき法における業務" },
    { id: "kankeihouki-penalty", label: "あはき法における罰則" },
    { id: "kankeihouki-law", label: "あはき法全般" },
    { id: "kankeihouki-related", label: "関係法規" },
  ],
  kaibou: [
    { id: "kaibou-general", label: "解剖学一般" },
    { id: "kaibou-skeleton", label: "骨格系" },
    { id: "kaibou-muscle", label: "筋系" },
    { id: "kaibou-viscera", label: "内臓系" },
    { id: "kaibou-vascular", label: "脈管系" },
    { id: "kaibou-nerve", label: "神経系" },
    { id: "kaibou-sense", label: "感覚器系" },
  ],
  seiri: [
    { id: "seiri-basic", label: "生理学の基礎" },
    { id: "seiri-circulation", label: "循環" },
    { id: "seiri-respiration", label: "呼吸" },
    { id: "seiri-digestion", label: "消化と吸収" },
    { id: "seiri-metabolism", label: "代謝" },
    { id: "seiri-temperature", label: "体温" },
    { id: "seiri-excretion", label: "排泄" },
    { id: "seiri-endocrine", label: "内分泌" },
    { id: "seiri-reproduction", label: "生殖と成長" },
    { id: "seiri-nerve", label: "神経" },
    { id: "seiri-muscle", label: "筋肉" },
    { id: "seiri-movement", label: "身体の運動" },
    { id: "seiri-coordination", label: "身体活動の協調" },
    { id: "seiri-sense", label: "感覚" },
    { id: "seiri-defense", label: "生体の防御機構" },
  ],
  byouri: [
    { id: "byouri-basic", label: "病理学の基礎" },
    { id: "byouri-cause", label: "病因" },
    { id: "byouri-circulation", label: "循環障害" },
    { id: "byouri-degenerative", label: "退行性病変（代謝障害）" },
    { id: "byouri-progressive", label: "進行性病変" },
    { id: "byouri-inflammation", label: "炎症" },
    { id: "byouri-immunity", label: "免疫異常とアレルギー" },
    { id: "byouri-tumor", label: "腫瘍" },
    { id: "byouri-congenital", label: "先天性異常" },
  ],
  souron: [
    { id: "souron-examination", label: "診察法" },
    { id: "souron-lab", label: "臨床検査法" },
    { id: "souron-treatment", label: "治療法" },
    { id: "souron-psychology", label: "臨床心理" },
  ],
  kakuron: [
    { id: "kakuron-infection", label: "感染症" },
    { id: "kakuron-neuromuscular", label: "神経・筋疾患" },
    { id: "kakuron-respiratory", label: "呼吸器・胸壁疾患" },
    { id: "kakuron-cardiovascular", label: "循環器疾患" },
    { id: "kakuron-digestive", label: "消化管疾患" },
    { id: "kakuron-urology", label: "泌尿生殖器疾患" },
    { id: "kakuron-hematology", label: "血液・造血器疾患" },
    { id: "kakuron-metabolism", label: "代謝・栄養疾患" },
    { id: "kakuron-endocrine", label: "内分泌疾患" },
    { id: "kakuron-autoimmune", label: "自己免疫疾患" },
    { id: "kakuron-musculoskeletal", label: "運動器疾患" },
    { id: "kakuron-dermatology", label: "皮膚・頭頸部疾患" },
    { id: "kakuron-psychiatric", label: "精神・心身医学的疾患" },
    { id: "kakuron-anesthesia", label: "麻酔" },
    { id: "kakuron-functional", label: "機能性疾患" },
    { id: "kakuron-surgery", label: "一般外科" },
    { id: "kakuron-gynecology", label: "婦人科疾患" },
    { id: "kakuron-pediatrics", label: "小児科疾患" },
    { id: "kakuron-oral", label: "口腔疾患" },
    { id: "kakuron-other", label: "その他" },
  ],
  reha: [
    { id: "reha-overview", label: "リハビリテーションの概要" },
    { id: "reha-medical", label: "医学的リハビリテーションの概要" },
    { id: "reha-assessment", label: "障害の評価" },
    { id: "reha-medical-rehab", label: "医学的リハビリテーション" },
    { id: "reha-kinesiology", label: "運動学の基盤" },
    { id: "reha-stroke", label: "脳卒中のリハビリテーション" },
    { id: "reha-spinal", label: "脊髄損傷のリハビリテーション" },
    { id: "reha-amputation", label: "切断" },
    { id: "reha-cp", label: "脳性麻痺" },
    { id: "reha-orthopedic", label: "整形外科・運動器疾患" },
    { id: "reha-respiratory", label: "呼吸器疾患" },
    { id: "reha-cardiac", label: "心疾患" },
    { id: "reha-elderly", label: "高齢者のリハビリテーション" },
  ],
  tougai: [
    { id: "tougai-basic", label: "東洋医学の基礎" },
    { id: "tougai-qi-blood", label: "気血・津液の生理" },
    { id: "tougai-zangfu", label: "五臓六腑" },
    { id: "tougai-zofu-keiraku", label: "臓腑経絡論" },
    { id: "tougai-etiology", label: "病因論" },
    { id: "tougai-pathology", label: "病理と症証" },
    { id: "tougai-diagnosis", label: "東洋医学的診察法と証の立て方" },
    { id: "tougai-treatment", label: "治療法" },
  ],
  keiketu: [
    { id: "keiketu-basic", label: "経絡・経穴の基礎" },
    { id: "keiketu-fourteen", label: "十四経脈の取穴法" },
    { id: "keiketu-extra", label: "奇経・奇穴" },
    { id: "keiketu-important", label: "要穴" },
    { id: "keiketu-research", label: "経絡・経穴の現代医学的研究" },
  ],
  tourin: [
    { id: "tourin-diagnosis-treatment", label: "診断と治療" },
    { id: "tourin-records", label: "診察と記録" },
    { id: "tourin-treatment-basic", label: "施術の基礎" },
    { id: "tourin-symptom-approach", label: "症候に対するアプローチ" },
    { id: "tourin-western-approach", label: "西洋医学からのアプローチ" },
    { id: "tourin-oriental-approach", label: "東洋医学からのアプローチ" },
    { id: "tourin-elderly", label: "高齢者に対する施術" },
    { id: "tourin-sports", label: "スポーツ領域" },
    { id: "tourin-industrial", label: "産業衛生" },
    { id: "tourin-health", label: "健康と鍼灸" },
    { id: "tourin-other", label: "その他" },
  ],
  hari: [
    { id: "hari-basic", label: "鍼の基礎知識" },
    { id: "hari-technique", label: "基本的な刺鍼方法" },
    { id: "hari-special", label: "特殊鍼法" },
    { id: "hari-clinical", label: "鍼の臨床応用" },
    { id: "hari-risk", label: "リスク管理" },
    { id: "hari-treatment-basic", label: "鍼治効の基礎" },
    { id: "hari-theory", label: "鍼療法の治効理論" },
    { id: "hari-related", label: "関連学説" },
  ],
  kyu: [
    { id: "kyu-basic", label: "灸の基礎知識" },
    { id: "kyu-types", label: "灸術の種類" },
    { id: "kyu-clinical", label: "灸の臨床応用" },
    { id: "kyu-risk", label: "リスク管理" },
    { id: "kyu-theory", label: "灸治効の基礎" },
    { id: "kyu-efficacy-theory", label: "灸療法の治効理論" },
    { id: "kyu-related", label: "関連学説" },
  ],
};

export const questQuestionCountOptions = [5, 10, 20] as const;

export const DEFAULT_QUEST_AVAILABLE_COUNT = 20;

export type QuestQuestionCount = number;

/** 登録問題数に応じて選べる問題数（5問未満の中分類は全問のみ等） */
export function getSelectableQuestQuestionCounts(availableCount: number): number[] {
  const safeAvailable = Math.max(0, Math.floor(availableCount));

  if (safeAvailable === 0) {
    return [];
  }

  const fromStandard = questQuestionCountOptions.filter(
    (count) => count <= safeAvailable,
  );

  if (fromStandard.length > 0) {
    return [...fromStandard];
  }

  return [safeAvailable];
}

export function getDefaultQuestQuestionCount(availableCount: number): number {
  const options = getSelectableQuestQuestionCounts(availableCount);
  return options[options.length - 1] ?? 0;
}

export function normalizeSelectedQuestQuestionCount(
  availableCount: number,
  selectedCount: number,
): number {
  const options = getSelectableQuestQuestionCounts(availableCount);

  if (options.includes(selectedCount)) {
    return selectedCount;
  }

  return getDefaultQuestQuestionCount(availableCount);
}

/** 問題数選択 UI に表示する補足（全科目・複数中分類対応） */
export function getQuestQuestionCountHint(
  availableCount: number,
  selectedSubcategoryCount = 1,
): string | null {
  if (selectedSubcategoryCount === 0) {
    return "中分類を1つ以上選んでください。";
  }

  const safeAvailable = Math.max(0, Math.floor(availableCount));

  if (safeAvailable === 0) {
    return selectedSubcategoryCount > 1
      ? "選択した中分類に問題が登録されていません。"
      : "この中分類には問題が登録されていません。";
  }

  const selectableCounts = getSelectableQuestQuestionCounts(safeAvailable);
  const maxSelectable = selectableCounts[selectableCounts.length - 1] ?? 0;

  if (selectableCounts.length <= 1) {
    return null;
  }

  const countLabel =
    selectedSubcategoryCount > 1 ? "選択した中分類の登録問題" : "この中分類の登録問題";

  if (safeAvailable < questQuestionCountOptions[0]) {
    return `${countLabel}は合計${safeAvailable}問です。`;
  }

  if (maxSelectable < safeAvailable) {
    return `登録問題は合計${safeAvailable}問です（最大${maxSelectable}問まで選べます）。`;
  }

  if (selectedSubcategoryCount > 1) {
    return `選択した中分類の登録問題は合計${safeAvailable}問です。`;
  }

  return null;
}

/** 複数中分類から出題する中分類を問番号に応じて割り当て */
export function pickQuestSubcategoryForQuestionIndex(
  subcategoryIds: string[],
  questionIndex: number,
): string | null {
  if (subcategoryIds.length === 0) {
    return null;
  }

  return subcategoryIds[questionIndex % subcategoryIds.length] ?? null;
}

export function formatQuestQuestionCountLabel(count: number): string {
  return `${count}問`;
}

/** 中分類リストに登録問題数バッジを出すか（5問未満など選択肢が限られる場合） */
export function shouldShowQuestSubcategoryCountBadge(
  availableCount: number,
): boolean {
  const safeAvailable = Math.max(0, Math.floor(availableCount));
  return (
    safeAvailable > 0 &&
    safeAvailable < questQuestionCountOptions[0]
  );
}

export function getQuestSubcategories(subjectId: string): QuestSubcategory[] {
  return questSubcategoriesBySubject[subjectId] ?? [
    { id: `${subjectId}-general`, label: "総合" },
  ];
}

export function getQuestSubcategoryLabel(
  subjectId: string,
  subcategoryId: string | null,
): string {
  if (!subcategoryId) {
    return "総合";
  }

  return (
    getQuestSubcategories(subjectId).find((item) => item.id === subcategoryId)?.label ??
    "総合"
  );
}

/** API から取得した中分類リストで、選択中分類の登録問題数合計を返す */
export function sumQuestSubcategoryQuestionCounts(
  subcategories: Array<{ id: string; questionCount: number }>,
  selectedIds: string[],
): number {
  return selectedIds.reduce((total, id) => {
    const match = subcategories.find((item) => item.id === id);
    return total + (match?.questionCount ?? 0);
  }, 0);
}
