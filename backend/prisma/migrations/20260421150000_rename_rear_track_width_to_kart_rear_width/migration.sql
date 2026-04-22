-- Rename column on Submission
ALTER TABLE "Submission" RENAME COLUMN "rearTrackWidth" TO "kartRearWidth";

-- Update any team formConfig JSON that references the old key in enabledFields / requiredFields
UPDATE "Team"
SET "formConfig" = REPLACE("formConfig"::text, '"rearTrackWidth"', '"kartRearWidth"')::jsonb
WHERE "formConfig"::text LIKE '%"rearTrackWidth"%';
