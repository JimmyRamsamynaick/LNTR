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
    premium_tier integer default 0,
    incognito_mode boolean default false,
    flames_count integer default 0,
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

-- Table: profile_views (Visiteurs récents)
create table if not exists public.profile_views (
    profile_id text references public.members(id) on delete cascade,
    viewer_id text references public.members(id) on delete cascade,
    viewer_username text not null,
    viewer_avatar text,
    viewed_at timestamp with time zone default now(),
    primary key (profile_id, viewer_id)
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
drop function if exists public.check_if_staff(text);
drop function if exists public.increment_flames(text);

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

-- Fonction: Incrémenter les flammes (RPC)
create or replace function public.increment_flames(member_id text)
returns void as $$
begin
  update public.members
  set flames_count = coalesce(flames_count, 0) + 1
  where id = member_id;
end;
$$ language plpgsql security definer;

-- 4. POLITIQUES RLS (Row Level Security)

-- Nettoyage des anciennes politiques pour éviter les erreurs "already exists"
do $$ 
begin
    -- members
    drop policy if exists "Tout le monde peut voir les membres" on public.members;
    drop policy if exists "L'utilisateur ou le staff peut modifier son profil" on public.members;
    drop policy if exists "Tout le monde peut s'enregistrer" on public.members;
    
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

-- Activer RLS sur toutes les tables
alter table public.members enable row level security;
alter table public.profile_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.shoutbox enable row level security;
alter table public.profile_views enable row level security;
alter table public.private_messages enable row level security;

-- Politiques pour members
create policy "Tout le monde peut voir les membres" on public.members for select using (true);
create policy "L'utilisateur ou le staff peut modifier son profil" on public.members for update
    using (auth.uid()::text = id or public.check_if_staff(auth.uid()::text));
create policy "Tout le monde peut s'enregistrer" on public.members for insert with check (true);

-- Politiques pour profile_comments
create policy "Tout le monde peut lire les commentaires" on public.profile_comments for select using (true);
create policy "Les membres connectés peuvent commenter" on public.profile_comments for insert with check (auth.uid() is not null);
create policy "Le propriétaire, l'auteur ou le staff peut supprimer" on public.profile_comments for delete
    using (auth.uid()::text = user_id or auth.uid()::text = profile_id or public.check_if_staff(auth.uid()::text));

-- Politiques pour notifications
create policy "L'utilisateur peut lire ses notifications" on public.notifications for select using (auth.uid()::text = user_id);
create policy "L'utilisateur peut marquer comme lu" on public.notifications for update using (auth.uid()::text = user_id);
create policy "Système/Utilisateurs peuvent créer des notifications" on public.notifications for insert with check (true);

-- Politiques pour shoutbox (Murmures)
create policy "Tout le monde peut lire les murmures" on public.shoutbox for select using (true);
create policy "Les membres connectés peuvent murmurer" on public.shoutbox for insert with check (auth.uid() is not null);
create policy "Le staff peut supprimer des murmures" on public.shoutbox for delete using (public.check_if_staff(auth.uid()::text));

-- Politiques pour profile_views
create policy "Tout le monde peut voir les visites" on public.profile_views for select using (true);
create policy "Les membres peuvent enregistrer une visite" on public.profile_views for insert with check (auth.uid() is not null);
create policy "Les membres peuvent mettre à jour leur visite" on public.profile_views for update using (auth.uid()::text = viewer_id);

-- Politiques pour private_messages
create policy "L'expéditeur et le destinataire peuvent lire" on public.private_messages for select 
    using (auth.uid()::text = from_id or auth.uid()::text = to_id);
create policy "Les membres peuvent envoyer des messages" on public.private_messages for insert with check (auth.uid() is not null);
create policy "Le destinataire peut marquer comme lu" on public.private_messages for update using (auth.uid()::text = to_id);

-- 5. INDEX POUR LES PERFORMANCES
create index if not exists idx_comments_profile_id on public.profile_comments(profile_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_shoutbox_created_at on public.shoutbox(created_at desc);
create index if not exists idx_messages_conversation on public.private_messages(from_id, to_id);
