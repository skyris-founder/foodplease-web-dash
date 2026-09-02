-- ROLES
create type public.app_role as enum ('cliente','restaurante','repartidor');
create type public.order_status as enum ('recibido','preparacion','listo','en_camino','entregado');
create type public.courier_status as enum ('disponible','en_entrega','fuera_servicio');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "set own role" on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

-- RESTAURANTS
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  phone text not null default '',
  schedule text not null default '',
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.restaurants to anon;
grant select, insert, update on public.restaurants to authenticated;
grant all on public.restaurants to service_role;
alter table public.restaurants enable row level security;
create policy "restaurants public read" on public.restaurants for select using (true);
create policy "restaurants manage" on public.restaurants for update to authenticated using (public.has_role(auth.uid(),'restaurante')) with check (public.has_role(auth.uid(),'restaurante'));
create trigger restaurants_updated_at before update on public.restaurants for each row execute function public.set_updated_at();

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories manage" on public.categories for all to authenticated using (public.has_role(auth.uid(),'restaurante')) with check (public.has_role(auth.uid(),'restaurante'));

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price integer not null default 0,
  available boolean not null default true,
  emoji text not null default '🍽️',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (true);
create policy "products manage" on public.products for all to authenticated using (public.has_role(auth.uid(),'restaurante')) with check (public.has_role(auth.uid(),'restaurante'));
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- COURIERS
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  vehicle text not null default 'Moto',
  phone text not null default '',
  status public.courier_status not null default 'disponible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.couriers to authenticated;
grant all on public.couriers to service_role;
alter table public.couriers enable row level security;
create policy "couriers read for staff" on public.couriers for select to authenticated
  using (public.has_role(auth.uid(),'restaurante') or public.has_role(auth.uid(),'repartidor'));
create policy "courier insert own" on public.couriers for insert to authenticated with check (auth.uid() = user_id);
create policy "courier update own" on public.couriers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "restaurant update couriers" on public.couriers for update to authenticated
  using (public.has_role(auth.uid(),'restaurante')) with check (public.has_role(auth.uid(),'restaurante'));
create trigger couriers_updated_at before update on public.couriers for each row execute function public.set_updated_at();

-- ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null default to_char(now(),'YYMMDD') || lpad((floor(random()*10000))::text, 4, '0'),
  customer_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  address text not null default '',
  note text,
  status public.order_status not null default 'recibido',
  delivery_fee integer not null default 1500,
  subtotal integer not null default 0,
  total integer not null default 0,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders customer read" on public.orders for select to authenticated using (auth.uid() = customer_id);
create policy "orders customer insert" on public.orders for insert to authenticated with check (auth.uid() = customer_id);
create policy "orders restaurant read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'restaurante'));
create policy "orders restaurant update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'restaurante')) with check (public.has_role(auth.uid(),'restaurante'));
create policy "orders courier read" on public.orders for select to authenticated using (
  public.has_role(auth.uid(),'repartidor') and (
    status in ('listo','en_camino','entregado')
    or courier_id in (select id from public.couriers where user_id = auth.uid())
  )
);
create policy "orders courier update" on public.orders for update to authenticated using (
  public.has_role(auth.uid(),'repartidor') and (
    courier_id is null or courier_id in (select id from public.couriers where user_id = auth.uid())
  )
) with check (
  public.has_role(auth.uid(),'repartidor') and
  courier_id in (select id from public.couriers where user_id = auth.uid())
);
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- ORDER ITEMS
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price integer not null default 0,
  qty integer not null default 1,
  created_at timestamptz not null default now()
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id)
);
create policy "order items insert" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- ORDER STATUS HISTORY
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert on public.order_status_history to authenticated;
grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;
create policy "history read" on public.order_status_history for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id)
);
create policy "history insert" on public.order_status_history for insert to authenticated with check (auth.uid() = changed_by);

-- SEED
insert into public.restaurants (id, name, address, phone, schedule)
values ('11111111-1111-4111-8111-111111111111','Burger House Providencia','Av. Providencia 2145, Providencia','+56 2 2345 6789','Lun a Dom · 11:00 – 23:30');

insert into public.categories (id, restaurant_id, name, sort_order) values
 ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-111111111111','Hamburguesas',1),
 ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-111111111111','Acompañamientos',2),
 ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-111111111111','Bebidas',3),
 ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-111111111111','Postres',4);

insert into public.products (restaurant_id, category_id, name, description, price, available, emoji) values
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000001','Hamburguesa Clásica','Carne 150g, queso cheddar, lechuga, tomate y salsa de la casa.',6990,true,'🍔'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000001','Doble Cheddar','Doble carne, doble cheddar fundido y cebolla caramelizada.',8990,true,'🍔'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000001','Veggie Burger','Medallón de garbanzos y quinoa con alioli de albahaca.',7490,true,'🥬'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000002','Papas Fritas','Corte rústico con sal de mar y romero.',2990,true,'🍟'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000002','Aros de Cebolla','Cebolla apanada crujiente con salsa ranch.',3490,false,'🧅'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000003','Bebida','Línea de bebidas 350 ml, sabores surtidos.',1690,true,'🥤'),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000004','Brownie','Brownie tibio de chocolate con nueces.',2790,true,'🍫');