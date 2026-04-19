-- Interaction integrity constraints for production count accuracy.
-- Run in Supabase SQL editor once.

-- Ensure one like per user per post.
create unique index if not exists post_likes_post_user_unique
on public.post_likes (post_id, user_id);

-- Ensure one save per user per post.
create unique index if not exists saved_posts_post_user_unique
on public.saved_posts (post_id, user_id);

-- Ensure one like per user per comment.
create unique index if not exists comment_likes_comment_user_unique
on public.comment_likes (comment_id, user_id);

-- Optional polymorphic likes table support (if used).
create unique index if not exists likes_post_user_unique
on public.likes (post_id, user_id)
where post_id is not null;

-- Boltz interactions (schema variant A).
create unique index if not exists boltz_likes_boltz_user_unique
on public.boltz_likes (boltz_id, user_id);

create unique index if not exists saved_boltz_boltz_user_unique
on public.saved_boltz (boltz_id, user_id);

-- Boltz interactions (schema variant B).
create unique index if not exists boltz_saves_boltz_user_unique
on public.boltz_saves (boltz_id, user_id);

-- Optional boltz shares table.
create unique index if not exists boltz_shares_boltz_user_unique
on public.boltz_shares (boltz_id, user_id);
