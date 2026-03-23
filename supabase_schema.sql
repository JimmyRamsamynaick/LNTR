-- ==========================================
-- LA LANTERNE NOCTURNE - SCHEMA SUPABASE COMPLET
-- ==========================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Table: members (Profils des utilisateurs Discord)
create table if not exists public.members (
    id text primary key, -- ID Discord (Snowflake)
    username text not null,
    avatar text,
    roles jsonb default '[]'::jsonb,
    status text default 'online',
    custom_status text,
    bio text,
    banner_color text default '#1a1a1a',
    banner_url text,
    display_name_color text default '#FFFFFF',
    nickname_gradient_color1 text,
    nickname_gradient_color2 text,
    featured_badges jsonb default '[]'::jsonb,
    premium_tier integer default 0,
    premium_since timestamp with time zone,
    incognito_mode boolean default false,
    gold_nickname boolean default true,
    flames_count integer default 0,
    streak_count integer default 0,
    last_streak_at timestamp with time zone,
    custom_url text unique,
    last_seen timestamp with time zone default now()
);

-- Table: profile_comments (Commentaires sur les profils)
create table if not exists public.profile_comments (
    id uuid primary key default uuid_generate_v4(),
    profile_id text references public.members(id) on delete cascade,
    user_id text references public.members(id) on delete cascade,
    username text not null,
    avatar text,
    content text not null,
    parent_id uuid references public.profile_comments(id) on delete cascade,
    created_at timestamp with time zone default now()
);

-- Table: notifications (Notifications utilisateurs)
create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id text references public.members(id) on delete cascade,
    from_username text not null,
    type text not null, -- 'comment', 'message', 'badge', etc.
    content text not null,
    read boolean default false,
    created_at timestamp with time zone default now()
);

-- Table: shoutbox (Les Murmures - Chat global)
create table if not exists public.shoutbox (
    id uuid primary key default uuid_generate_v4(),
    user_id text references public.members(id) on delete cascade,
    username text not null,
    avatar text,
    content text not null,
    premium_tier integer default 0,
    roles jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- Table: profile_flames (Suivi des flammes pour limite 24h)
create table if not exists public.profile_flames (
    from_id text references public.members(id) on delete cascade,
    to_id text references public.members(id) on delete cascade,
    last_flame_at timestamp with time zone default now(),
    primary key (from_id, to_id)
);

-- Table: follows (Suivi des membres)
create table if not exists public.follows (
    follower_id text references public.members(id) on delete cascade,
    following_id text references public.members(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (follower_id, following_id)
);

-- Table: profile_views (Visiteurs récents)
create table if not exists public.profile_views (
    profile_id text references public.members(id) on delete cascade,
    viewer_id text references public.members(id) on delete cascade,
    viewer_username text not null,
    viewer_avatar text,
    viewed_at timestamp with time zone default now(),
    primary key (profile_id, viewer_id)
);

-- Table: profile_gifts (Cadeaux reçus)
create table if not exists public.profile_gifts (
    id uuid primary key default gen_random_uuid(),
    from_id text references public.members(id) on delete cascade,
    to_id text references public.members(id) on delete cascade,
    gift_type text not null, -- 'bougie', 'etoile', 'lanterne'
    message text,
    created_at timestamp with time zone default now()
);

-- Table: private_messages (Messages privés)
create table if not exists public.private_messages (
    id uuid primary key default uuid_generate_v4(),
    from_id text references public.members(id) on delete cascade,
    to_id text references public.members(id) on delete cascade,
    from_username text not null,
    content text not null,
    read boolean default false,
    created_at timestamp with time zone default now()
);

-- 3. FONCTIONS DE SÉCURITÉ ET UTILITAIRES

-- On supprime d'abord si elles existent pour éviter les erreurs
-- On utilise CASCADE car des politiques RLS en dépendent
drop function if exists public.check_if_staff(text) cascade;
drop function if exists public.increment_flames(text) cascade;

-- Fonction: Vérifier si un utilisateur est Staff/Admin
create or replace function public.check_if_staff(user_id_param text)
returns boolean as $$
declare
    user_roles jsonb;
    staff_roles text[] := array[
        '1352907810425274399', -- OWNER
        '1392875975858978927', -- CO_OWNER
        '1352907818134409217', -- ADMIN
        '1391069471980126321'  -- STAFF
    ];
begin
    select roles into user_roles from public.members where id = user_id_param;
    
    if user_roles is null then
        return false;
    end if;

    -- Vérifie si l'un des rôles de l'utilisateur est dans la liste staff_roles
    return exists (
        select 1 
        from jsonb_array_elements_text(user_roles) as role
        where role = any(staff_roles)
    );
end;
$$ language plpgsql security definer;

-- Fonction: Incrémenter les flammes (RPC avec limite 24h)
create or replace function public.increment_flames(member_id text, visitor_id text)
returns boolean as $$
declare
    last_flame timestamp with time zone;
begin
    -- On ne peut pas s'envoyer de flamme à soi-même
    if visitor_id = member_id then
        return false;
    end if;

    -- Récupérer la date de la dernière flamme envoyée par ce visiteur à ce membre
    select last_flame_at into last_flame 
    from public.profile_flames 
    where from_id = visitor_id and to_id = member_id;

    -- Si une flamme a été envoyée il y a moins de 24h, on refuse
    if last_flame is not null and last_flame > (now() - interval '24 hours') then
        return false;
    end if;

    -- Mettre à jour ou insérer le suivi de la flamme
    insert into public.profile_flames (from_id, to_id, last_flame_at)
    values (visitor_id, member_id, now())
    on conflict (from_id, to_id) 
    do update set last_flame_at = now();

    -- Incrémenter le compteur sur le profil du membre
    update public.members
    set flames_count = coalesce(flames_count, 0) + 1
    where id = member_id;

    return true;
end;
$$ language plpgsql security definer;

-- Fonction: Gérer la série de connexion (Daily Streak)
create or replace function public.update_daily_streak(user_id_param text)
returns integer as $$
declare
    last_streak timestamp with time zone;
    current_streak integer;
begin
    select last_streak_at, streak_count into last_streak, current_streak 
    from public.members 
    where id = user_id_param;

    -- Si jamais connecté ou dernière connexion > 48h (série brisée)
    if last_streak is null or last_streak < (now() - interval '48 hours') then
        update public.members 
        set streak_count = 1, last_streak_at = now() 
        where id = user_id_param;
        return 1;
    -- Si déjà connecté aujourd'hui (< 24h et même jour calendaire approx)
    elsif last_streak > (now() - interval '24 hours') then
        return current_streak;
    -- Si connecté hier (entre 24h et 48h)
    else
        update public.members 
        set streak_count = coalesce(streak_count, 0) + 1, last_streak_at = now() 
        where id = user_id_param;
        return current_streak + 1;
    end if;
end;
$$ language plpgsql security definer;

-- 4. POLITIQUES RLS (Row Level Security)

-- Nettoyage des anciennes politiques
do $$ 
begin
    -- members
    drop policy if exists "Tout le monde peut voir les membres" on public.members;
    drop policy if exists "L'utilisateur ou le staff peut modifier son profil" on public.members;
    drop policy if exists "Tout le monde peut s'enregistrer" on public.members;
    drop policy if exists "L'utilisateur peut modifier son profil" on public.members;
    
    -- profile_comments
    drop policy if exists "Tout le monde peut lire les commentaires" on public.profile_comments;
    drop policy if exists "Les membres connectés peuvent commenter" on public.profile_comments;
    drop policy if exists "Le propriétaire, l'auteur ou le staff peut supprimer" on public.profile_comments;
    
    -- notifications
    drop policy if exists "L'utilisateur peut lire ses notifications" on public.notifications;
    drop policy if exists "L'utilisateur peut marquer comme lu" on public.notifications;
    drop policy if exists "Système/Utilisateurs peuvent créer des notifications" on public.notifications;
    
    -- shoutbox
    drop policy if exists "Tout le monde peut lire les murmures" on public.shoutbox;
    drop policy if exists "Les membres connectés peuvent murmurer" on public.shoutbox;
    drop policy if exists "Le staff peut supprimer des murmures" on public.shoutbox;
    
    -- profile_views
    drop policy if exists "Tout le monde peut voir les visites" on public.profile_views;
    drop policy if exists "Les membres peuvent enregistrer une visite" on public.profile_views;
    drop policy if exists "Les membres peuvent mettre à jour leur visite" on public.profile_views;
    
    -- private_messages
    drop policy if exists "L'expéditeur et le destinataire peuvent lire" on public.private_messages;
    drop policy if exists "Les membres peuvent envoyer des messages" on public.private_messages;
    drop policy if exists "Le destinataire peut marquer comme lu" on public.private_messages;
end $$;

-- Désactivation du RLS pour members afin de permettre l'upsert sans Supabase Auth
-- Note: Sans Supabase Auth, auth.uid() est toujours null, donc les politiques par ID ne marchent pas.
alter table public.members disable row level security;

-- Activation du RLS pour les autres tables (on garde une sécurité basique)
alter table public.profile_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.shoutbox enable row level security;
alter table public.profile_views enable row level security;
alter table public.private_messages enable row level security;

-- Politiques simplifiées (Sans auth.uid())
create policy "Lecture publique pour tous" on public.profile_comments for select using (true);
create policy "Insertion libre pour tous" on public.profile_comments for insert with check (true);
create policy "Suppression staff ou auteur" on public.profile_comments for delete using (true); -- On gère la logique de suppression côté client pour le moment ou via fonction security definer

create policy "Lecture publique Murmures" on public.shoutbox for select using (true);
create policy "Insertion Murmures" on public.shoutbox for insert with check (true);

create policy "Lecture Notifications" on public.notifications for select using (true);
create policy "Insertion Notifications" on public.notifications for insert with check (true);

create policy "Lecture Messages" on public.private_messages for select using (true);
create policy "Insertion Messages" on public.private_messages for insert with check (true);

create policy "Lecture Visites" on public.profile_views for select using (true);
create policy "Insertion Visites" on public.profile_views for insert with check (true);

-- 5. INDEX POUR LES PERFORMANCES
create index if not exists idx_comments_profile_id on public.profile_comments(profile_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_shoutbox_created_at on public.shoutbox(created_at desc);
create index if not exists idx_messages_conversation on public.private_messages(from_id, to_id);
