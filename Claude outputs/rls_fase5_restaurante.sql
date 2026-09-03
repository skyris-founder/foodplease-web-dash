-- Fase 5 — restaurante: ver y operar sus propios pedidos (avanzar estado,
-- asignar repartidor), y editar los datos de su propio restaurante.
-- Aditivo. No borra ni modifica tablas, columnas ni datos existentes.
-- Usa current_profile_id() y current_role(), ya creadas en rls_fase1_final.sql.

create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.restaurants where owner_id = public.current_profile_id()
$$;

-- restaurants: el dueño puede actualizar su propio restaurante (Configuración)
create policy "restaurants_update_own" on public.restaurants
  for update to authenticated
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id());

-- orders: el restaurante ve y actualiza sus propios pedidos
-- (avanzar recibido -> preparación -> listo, asignar repartidor)
create policy "orders_select_restaurant" on public.orders
  for select to authenticated
  using (restaurant_id = public.current_restaurant_id());

create policy "orders_update_restaurant" on public.orders
  for update to authenticated
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

-- order_items: el restaurante lee los ítems de sus propios pedidos (detalle del pedido)
create policy "order_items_select_restaurant" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.restaurant_id = public.current_restaurant_id()
    )
  );

-- order_status_history: el restaurante registra y lee los cambios de estado de sus pedidos
create policy "order_status_history_insert_restaurant" on public.order_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.restaurant_id = public.current_restaurant_id()
    )
  );

create policy "order_status_history_select_restaurant" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.restaurant_id = public.current_restaurant_id()
    )
  );

-- couriers: el restaurante puede ver el pool de repartidores para asignarlos a un pedido
-- (no puede modificarlos: solo el propio repartidor cambia su disponibilidad)
create policy "couriers_select_restaurant" on public.couriers
  for select to authenticated
  using (public.current_role() = 'restaurante');
