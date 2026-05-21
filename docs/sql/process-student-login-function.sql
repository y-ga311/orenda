-- ログイン成功時: students_login を更新し、その日（JST）初回なら gacha_points に加算
-- アプリは POST /api/login 認証後に service_role で呼び出す

CREATE OR REPLACE FUNCTION public.process_student_login(
  p_gakusei_id text,
  p_daily_bonus integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_login timestamptz;
  v_gacha_points integer;
  v_bonus integer := 0;
  v_today_jst date;
  v_last_login_jst date;
BEGIN
  IF p_gakusei_id IS NULL OR btrim(p_gakusei_id) = '' THEN
    RAISE EXCEPTION 'invalid_gakusei_id' USING ERRCODE = '22023';
  END IF;

  IF p_daily_bonus IS NULL OR p_daily_bonus < 0 THEN
    RAISE EXCEPTION 'invalid_daily_bonus' USING ERRCODE = '22023';
  END IF;

  v_today_jst := (timezone('Asia/Tokyo', now()))::date;

  SELECT students_login, gacha_points
    INTO v_last_login, v_gacha_points
    FROM public.students
    WHERE gakusei_id = p_gakusei_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_not_found';
  END IF;

  IF v_last_login IS NULL THEN
    v_bonus := p_daily_bonus;
  ELSE
    v_last_login_jst := (timezone('Asia/Tokyo', v_last_login))::date;
    IF v_last_login_jst < v_today_jst THEN
      v_bonus := p_daily_bonus;
    END IF;
  END IF;

  UPDATE public.students
    SET
      students_login = now(),
      gacha_points = gacha_points + v_bonus
    WHERE gakusei_id = p_gakusei_id
    RETURNING gacha_points INTO v_gacha_points;

  RETURN jsonb_build_object(
    'gacha_points', v_gacha_points,
    'daily_bonus_awarded', v_bonus > 0,
    'daily_bonus_points', v_bonus
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_student_login(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_student_login(text, integer) TO service_role;
