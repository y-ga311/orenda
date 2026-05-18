-- PostgREST から service_role で呼び出し、ガチャポイントを原子性を保って差し引く
-- （アプリは POST /api/gacha-spin 経由のみ利用する想定）

CREATE OR REPLACE FUNCTION public.consume_gacha_points(
  p_gakusei_id text,
  p_amount integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023';
  END IF;

  UPDATE public.students
    SET gacha_points = gacha_points - p_amount
    WHERE gakusei_id = p_gakusei_id
      AND gacha_points >= p_amount
    RETURNING gacha_points INTO new_balance;

  IF new_balance IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.students WHERE gakusei_id = p_gakusei_id) THEN
      RAISE EXCEPTION 'insufficient_gacha_points';
    ELSE
      RAISE EXCEPTION 'student_not_found';
    END IF;
  END IF;

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_gacha_points(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_gacha_points(text, integer) TO service_role;
