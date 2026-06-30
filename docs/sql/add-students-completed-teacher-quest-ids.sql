-- 教員クエストのクリア済み ID 一覧（生徒1行・JSON配列）
-- アプリは completed_teacher_quest_ids を参照します。

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS completed_teacher_quest_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.students.completed_teacher_quest_ids IS
  'クリア済み teacher_quests.id の JSON 配列（1クエスト1回）';

-- 原子的に1件だけ追加（既に含まれていれば false）
CREATE OR REPLACE FUNCTION public.append_teacher_quest_completion(
  p_gakusei_id text,
  p_teacher_quest_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET completed_teacher_quest_ids =
    COALESCE(completed_teacher_quest_ids, '[]'::jsonb) || to_jsonb(p_teacher_quest_id)
  WHERE gakusei_id = p_gakusei_id
    AND NOT (
      COALESCE(completed_teacher_quest_ids, '[]'::jsonb)
        @> jsonb_build_array(p_teacher_quest_id)
    );

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.append_teacher_quest_completion(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_teacher_quest_completion(text, text) TO service_role;
