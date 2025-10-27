BEGIN;
--> statement-breakpoint

-- 먼저 안전하게 드롭 (여러 번 실행해도 OK)
DROP TRIGGER IF EXISTS del_outboxes_on_project ON public.projects;
--> statement-breakpoint
DROP TRIGGER IF EXISTS del_outboxes_on_top_guard ON public.top_guards;
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.trg_del_outboxes_on_project();
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.trg_del_outboxes_on_top_guard();
--> statement-breakpoint

-- projects 삭제 시 outboxes 삭제
CREATE OR REPLACE FUNCTION public.trg_del_outboxes_on_project()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.outboxes
  WHERE rid = OLD.rid AND entity = 'project';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER del_outboxes_on_project
AFTER DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trg_del_outboxes_on_project();
--> statement-breakpoint

-- top_guards 삭제 시 outboxes 삭제
CREATE OR REPLACE FUNCTION public.trg_del_outboxes_on_top_guard()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.outboxes
  WHERE rid = OLD.rid AND entity = 'topGuard';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER del_outboxes_on_top_guard
AFTER DELETE ON public.top_guards
FOR EACH ROW EXECUTE FUNCTION public.trg_del_outboxes_on_top_guard();
--> statement-breakpoint

COMMIT;
