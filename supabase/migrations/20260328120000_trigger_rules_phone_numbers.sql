-- Add JSON array of E.164 (or formatted) numbers; keep phone_number as first entry for NOT NULL / legacy clients.
alter table trigger_rules add column if not exists phone_numbers jsonb;

update trigger_rules
set phone_numbers = jsonb_build_array(phone_number)
where phone_numbers is null
  and coalesce(trim(phone_number), '') <> '';

update trigger_rules
set phone_numbers = '[]'::jsonb
where phone_numbers is null;
