-- 廃止: study_sessions への保存は行わない。代わりに award-study-gacha-points-function.sql を使用してください。

DROP FUNCTION IF EXISTS public.register_study_session(text, text, text, integer);
