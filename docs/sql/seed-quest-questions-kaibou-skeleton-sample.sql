-- 解剖学 > 骨格系 のサンプル問題 3 問
-- 前提: quest_subjects / quest_subcategories / quest_questions テーブル作成済み

DELETE FROM public.quest_questions
WHERE subject_id = 'kaibou'
  AND subcategory_id = 'kaibou-skeleton'
  AND source = 'sample-seed';

INSERT INTO public.quest_questions (
  subject_id,
  subcategory_id,
  body,
  choice_1,
  choice_2,
  choice_3,
  choice_4,
  correct_index,
  explanation,
  sort_order,
  source,
  quest_scope,
  is_active
) VALUES
  (
    'kaibou',
    'kaibou-skeleton',
    '骨格系について、正しいものを1つ選んでください。',
    '成人の骨は206個である',
    'すべての骨は長骨である',
    '肋骨12対すべてが胸骨と直接つながる',
    '蝶形骨は頭蓋骨に含まれない',
    0,
    '成人の骨は一般に206個とされます。「すべて長骨」「12肋骨すべてが胸骨と直接連結」「蝶形骨が頭蓋骨に含まれない」はいずれも誤りです。',
    1,
    'sample-seed',
    'subject',
    true
  ),
  (
    'kaibou',
    'kaibou-skeleton',
    '椎骨について、誤っているものを1つ選んでください。',
    '颈椎は7個である',
    '胸椎は12個である',
    '腰椎は5個である',
    '仙椎は4個の椎骨が癒合したものである',
    3,
    '仙椎（薦骨）は5個の椎骨（S1〜S5）が癒合したものです。4個ではありません。颈椎7・胸椎12・腰椎5は正しい記述です。',
    2,
    'sample-seed',
    'subject',
    true
  ),
  (
    'kaibou',
    'kaibou-skeleton',
    '上肢骨について、正しいものを1つ選んでください。',
    '手根骨は14個ある',
    '橈骨は尺骨の外側（母指側）に位置する',
    '鎖骨は上腕骨と肩甲骨を直接つなぐ',
    '上腕骨は膝関節を構成する',
    1,
    '橈骨は母指側（外側）に位置します。手根骨は8個、鎖骨は胸骨と肩甲骨を結び、上腕骨は肘関節などに関与しますが膝関節は構成しません。',
    3,
    'sample-seed',
    'subject',
    true
  );
