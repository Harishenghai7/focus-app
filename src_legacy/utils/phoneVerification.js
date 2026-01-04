// Utilities for phone verification using Supabase and optional SMS backend
// Notes:
// - For security, SMS sending (Twilio, etc.) must be performed on a server or Edge Function.
// - This client code will call an optional API (REACT_APP_OTP_API_URL) to send SMS.
// - OTPs are stored in Supabase in the 'phone_otps' table with a 5-minute expiry.

import { supabase } from '../supabaseClient';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizePhone(phone) {
  // Normalize to E.164-like (keeps + and digits only)
  return (phone || '').toString().replace(/[^+\d]/g, '');
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSmsViaApi(phone, message) {
  const apiUrl = process.env.REACT_APP_OTP_API_URL; // Your backend endpoint that talks to Twilio/Firebase
  if (!apiUrl) return { sent: false, reason: 'No API configured' };
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    if (!res.ok) {
      const txt = await res.text();
      return { sent: false, reason: `API error: ${res.status} ${txt}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

export async function checkPhoneUnique(phoneNumber) {
  const phone = normalizePhone(phoneNumber);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116: No rows found for single(). maybeSingle() returns null data without error typically.
    throw error;
  }

  // unique if no profile found
  return !data;
}

export async function sendOTP(phoneNumber) {
  const phone = normalizePhone(phoneNumber);

  // Enforce unique phone numbers
  const unique = await checkPhoneUnique(phone);
  if (!unique) {
    return { ok: false, error: 'This phone number is already registered' };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Store or update OTP in phone_otps table
  const { error: upsertErr } = await supabase
    .from('phone_otps')
    .upsert(
      {
        phone_number: phone,
        otp_code: otp,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      },
      { onConflict: 'phone_number' }
    );

  if (upsertErr) {
    return { ok: false, error: upsertErr.message };
  }

  // Attempt to send SMS via optional API (server-side integration)
  const sms = await sendSmsViaApi(phone, `Your Focus verification code is ${otp}`);

  // For development convenience, return the OTP when SMS is not configured
  return { ok: true, devOtp: sms.sent ? undefined : otp, smsSent: sms.sent, smsReason: sms.reason };
}

export async function verifyOTP(phoneNumber, otpInput) {
  const phone = normalizePhone(phoneNumber);
  const otp = (otpInput || '').toString().replace(/\D/g, '');

  // Read OTP record
  const { data: record, error } = await supabase
    .from('phone_otps')
    .select('otp_code, expires_at')
    .eq('phone_number', phone)
    .single();

  if (error) {
    return { ok: false, error: 'Verification code not found. Please request a new code.' };
  }

  const now = Date.now();
  const exp = Date.parse(record.expires_at);
  if (Number.isNaN(exp) || now > exp) {
    return { ok: false, error: 'Verification code expired. Please request a new code.' };
  }

  if (record.otp_code !== otp) {
    return { ok: false, error: 'Invalid verification code.' };
  }

  // Mark user as verified and set phone on profile
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user?.id) {
    return { ok: false, error: 'Not authenticated.' };
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      phone_number: phone,
      phone_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', authData.user.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  // Cleanup OTP record after success (optional but recommended)
  await supabase.from('phone_otps').delete().eq('phone_number', phone);

  return { ok: true };
}
