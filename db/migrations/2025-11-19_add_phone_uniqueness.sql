-- Add unique constraint to profiles.phone_number
ALTER TABLE profiles
  ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);

-- Create table for OTP storage (if not exists)
create table if not exists phone_otps (
  phone_number text primary key,
  otp_code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Optional: automatic cleanup policy via extension/jobs can be added separately.
