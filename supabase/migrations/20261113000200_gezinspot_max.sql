-- Gezinspot: het oude standaardmaximum van 100 per kind liet kinderen niet sparen voor grote doelen.
-- Een pot met het ongewijzigde maximum 100 en een groter doel krijgt het doel als maximum.
update public.gezinspot set max_per_kind = least(doel, 5000) where max_per_kind = 100 and doel > 100;
alter table public.gezinspot alter column max_per_kind set default 300;
