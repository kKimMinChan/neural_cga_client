CREATE TYPE "public"."request_kind" AS ENUM('none', 'capture_request', 'intrinsic_request', 'extrinsic_capture', 'extrinsic_request');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('none', 'created', 'captured', 'submitted', 'result_received', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
CREATE TYPE "public"."capture_request_status" AS ENUM('requested', 'processing', 'completed', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."intrinsic_request_status" AS ENUM('requested', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."extrinsic_capture_request_status" AS ENUM('requested', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."extrinsic_mode" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "projects" (
	"rid" text PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"name_ver" integer DEFAULT 0 NOT NULL,
	"topGuardCount" integer DEFAULT 0,
	"created_by" integer,
	"company_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "extrinsic_captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"extrinsic_capture_request_id" integer,
	"bmp_name" text NOT NULL,
	"pcd_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extrinsic_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_guard_rid" text NOT NULL,
	"bmp_path" text,
	"pcd_path" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intrinsic_outputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"intrinsic_request_id" integer NOT NULL,
	"camera_matrix" text,
	"dist_coeffs" text,
	"per_image_reprojection_error" text,
	"used_image_count" integer,
	"mean_reprojection_error" real,
	"is_final" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extrinsic_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_guard_rid" text NOT NULL,
	"params" text,
	"is_final" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "top_guards" (
	"rid" text PRIMARY KEY NOT NULL,
	"project_rid" text NOT NULL,
	"name" varchar(255),
	"name_ver" integer DEFAULT 0 NOT NULL,
	"mac" varchar(17),
	"mac_ver" integer DEFAULT 0 NOT NULL,
	"web_rtc_url" text,
	"web_rtc_url_ver" integer DEFAULT 0 NOT NULL,
	"intrinsic_stage" "stage" DEFAULT 'created',
	"intrinsic_stage_ver" integer DEFAULT 0 NOT NULL,
	"extrinsic_stage" "stage" DEFAULT 'created',
	"extrinsic_stage_ver" integer DEFAULT 0 NOT NULL,
	"failure_stage" "request_kind" DEFAULT 'none',
	"failure_stage_ver" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intrinsic_captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"capture_request_id" integer NOT NULL,
	"file_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capture_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_guard_rid" text NOT NULL,
	"count" integer,
	"capture_request_status" "capture_request_status" DEFAULT 'requested',
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intrinsic_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_guard_rid" text NOT NULL,
	"intrinsic_request_status" "intrinsic_request_status" DEFAULT 'requested',
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intrinsic_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"intrinsic_request_id" integer NOT NULL,
	"intrinsic_capture_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intrinsic_overlays" (
	"id" serial PRIMARY KEY NOT NULL,
	"intrinsic_selection_id" integer NOT NULL,
	"file_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extrinsic_capture_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_guard_rid" text NOT NULL,
	"extrinsic_mode" "extrinsic_mode",
	"extrinsic_capture_request_status" "extrinsic_capture_request_status" DEFAULT 'requested',
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outboxes" (
	"op_id" text PRIMARY KEY NOT NULL,
	"entity" text NOT NULL,
	"rid" text NOT NULL,
	"patch" text NOT NULL,
	"updated_at" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"access_token" text,
	"name" text,
	"role" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "extrinsic_captures" ADD CONSTRAINT "extrinsic_captures_extrinsic_capture_request_id_extrinsic_capture_requests_id_fk" FOREIGN KEY ("extrinsic_capture_request_id") REFERENCES "public"."extrinsic_capture_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extrinsic_selections" ADD CONSTRAINT "extrinsic_selections_top_guard_rid_top_guards_rid_fk" FOREIGN KEY ("top_guard_rid") REFERENCES "public"."top_guards"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_outputs" ADD CONSTRAINT "intrinsic_outputs_intrinsic_request_id_intrinsic_requests_id_fk" FOREIGN KEY ("intrinsic_request_id") REFERENCES "public"."intrinsic_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extrinsic_results" ADD CONSTRAINT "extrinsic_results_top_guard_rid_top_guards_rid_fk" FOREIGN KEY ("top_guard_rid") REFERENCES "public"."top_guards"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_guards" ADD CONSTRAINT "top_guards_project_rid_projects_rid_fk" FOREIGN KEY ("project_rid") REFERENCES "public"."projects"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_captures" ADD CONSTRAINT "intrinsic_captures_capture_request_id_capture_requests_id_fk" FOREIGN KEY ("capture_request_id") REFERENCES "public"."capture_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capture_requests" ADD CONSTRAINT "capture_requests_top_guard_rid_top_guards_rid_fk" FOREIGN KEY ("top_guard_rid") REFERENCES "public"."top_guards"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_requests" ADD CONSTRAINT "intrinsic_requests_top_guard_rid_top_guards_rid_fk" FOREIGN KEY ("top_guard_rid") REFERENCES "public"."top_guards"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_selections" ADD CONSTRAINT "intrinsic_selections_intrinsic_request_id_intrinsic_requests_id_fk" FOREIGN KEY ("intrinsic_request_id") REFERENCES "public"."intrinsic_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_selections" ADD CONSTRAINT "intrinsic_selections_intrinsic_capture_id_intrinsic_captures_id_fk" FOREIGN KEY ("intrinsic_capture_id") REFERENCES "public"."intrinsic_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intrinsic_overlays" ADD CONSTRAINT "intrinsic_overlays_intrinsic_selection_id_intrinsic_selections_id_fk" FOREIGN KEY ("intrinsic_selection_id") REFERENCES "public"."intrinsic_selections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extrinsic_capture_requests" ADD CONSTRAINT "extrinsic_capture_requests_top_guard_rid_top_guards_rid_fk" FOREIGN KEY ("top_guard_rid") REFERENCES "public"."top_guards"("rid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_projects_updated_at" ON "projects" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_projects_rid" ON "projects" USING btree ("rid");--> statement-breakpoint
CREATE INDEX "ix_top_guards_project_rid" ON "top_guards" USING btree ("project_rid");--> statement-breakpoint
CREATE INDEX "ix_top_guards_updated_at" ON "top_guards" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_top_guards_rid" ON "top_guards" USING btree ("rid");