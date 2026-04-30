create or replace function public.finalize_verification_v2(
    p_user_id uuid,
    p_identity_hash text,
    p_device_id text,
    p_ocr_data jsonb,
    p_face_score numeric,
    p_age_group text
) returns jsonb as $$
declare
    v_result jsonb;
    v_existing_hash uuid;
    v_is_minor boolean;
    v_verification_status text;
    v_uniqueness_check jsonb;
    v_id_number text;
    v_id_type text;
    v_id_store_result jsonb;
begin
    v_id_number := p_ocr_data->>'idNumber';
    v_id_type := coalesce(p_ocr_data->>'idType', 'unknown');

    select id into v_existing_hash
    from public.profiles
    where identity_hash = p_identity_hash
        and id != p_user_id
    limit 1;

    if v_existing_hash is not null then
        return jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'This identity is already registered to another account'
        );
    end if;

    if v_id_number is not null and v_id_type is not null then
        if v_id_type = 'student' or v_id_type = 'school' or v_id_type = 'college' then
            v_id_store_result := public.store_student_id(
                p_user_id,
                v_id_number,
                coalesce(p_ocr_data->>'institution', ''),
                v_id_type
            );
            if not (v_id_store_result->>'success')::boolean then
                return jsonb_build_object(
                    'success', false,
                    'code', v_id_store_result->>'code',
                    'error', v_id_store_result->>'error'
                );
            end if;
        else
            v_id_store_result := public.store_id_number(p_user_id, v_id_number, v_id_type);
            if not (v_id_store_result->>'success')::boolean then
                return jsonb_build_object(
                    'success', false,
                    'code', v_id_store_result->>'code',
                    'error', v_id_store_result->>'error'
                );
            end if;
        end if;
    end if;

    v_uniqueness_check := public.check_identity_uniqueness(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        p_device_id
    );

    if not (v_uniqueness_check->>'unique')::boolean then
        return jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', v_uniqueness_check->>'message'
        );
    end if;

    if p_face_score < 0.5 then
        return jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
    end if;

    v_is_minor := p_age_group = '13-17';
    v_verification_status := case
        when v_is_minor then 'PENDING_GUARDIAN'
        else 'VERIFIED'
    end;

    update public.profiles set
        verification_status = v_verification_status,
        trust_shield_status = v_verification_status,
        focus_trust_status = v_verification_status,
        verification_step = 5,
        verification_locked = false,
        identity_hash = p_identity_hash,
        device_id = p_device_id,
        device_fingerprint = p_device_id,
        is_verified = (v_verification_status = 'VERIFIED'),
        trust_tier = case when v_verification_status = 'VERIFIED' then greatest(coalesce(trust_tier, 0), 4) else coalesce(trust_tier, 0) end,
        verification_metadata = jsonb_build_object(
            'ocr_data', p_ocr_data,
            'face_score', p_face_score,
            'age_group', p_age_group,
            'verified_at', now(),
            'verification_method', 'trust_shield_v3',
            'id_type', v_id_type,
            'id_stored', v_id_number is not null
        ),
        onboarding_completed = true,
        can_post = not v_is_minor,
        updated_at = now()
    where id = p_user_id;

    if not found then
        return jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Failed to update profile'
        );
    end if;

    insert into public.verification_audit_trail (
        user_id,
        device_id,
        stage,
        result,
        score,
        metadata
    ) values (
        p_user_id,
        p_device_id,
        'trust_shield_complete_v2',
        v_verification_status,
        p_face_score,
        jsonb_build_object(
            'identity_hash', p_identity_hash,
            'ocr_data', p_ocr_data,
            'age_group', p_age_group,
            'is_minor', v_is_minor,
            'id_type', v_id_type
        )
    );

    return jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor,
        'user_id', p_user_id,
        'id_type', v_id_type
    );
end;
$$ language plpgsql security definer;
