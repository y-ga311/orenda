-- students.gacha_points に加算する（学習タイマー: 1分 = 1pt など）
-- consume_gacha_points と対になる付与用 RPC

CREATE OR REPLACE FUNCTION public.award_gacha_points(
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
    SET gacha_points = gacha_points + p_amount
    WHERE gakusei_id = p_gakusei_id
    RETURNING gacha_points INTO new_balance;

  IF new_balance IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.students WHERE gakusei_id = p_gakusei_id) THEN
      RAISE EXCEPTION 'gacha_points_update_failed';
    ELSE
      RAISE EXCEPTION 'student_not_found';
    END IF;
  END IF;

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.award_gacha_points(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_gacha_points(text, integer) TO service_role;
