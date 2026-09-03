-- Fase 4 — repartidor: ver pedidos "listo" sin repartidor asignado, aceptarlos,
-- y avanzar el estado de sus propias entregas (listo -> en_camino -> entregado).
-- Aditivo. No borra ni modifica tablas, columnas ni datos existentes.
-- Usa current_profile_id() y current_role(), ya creadas en rls_fase1_final.sql.

create or replace function public.current_courier_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.couriers where profile_id = public.current_profile_id()
$$;

-- couriers: cada repartidor lee y actualiza (ej. su disponibilidad) su propia fila
create policy "couriers_select_own" on public.couriers
  for select to authenticated
  using (profile_id = public.current_profile_id());

create policy "couriers_update_own" on public.couriers
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- orders: el repartidor ve los pedidos "listo" sin asignar, y los suyos en curso
create policy "orders_select_repartidor" on public.orders
  for select to authenticated
  using (
    public.current_role() = 'repartidor'
    and (
      courier_id = public.current_courier_id()
      or (status = 'listo' and courier_id is null)
    )
  );

-- orders: el repartidor puede aceptar un pedido libre, o actualizar el estado de uno propio.
-- El "with check" obliga a que, tras el update, el pedido quede asignado a él mismo.
create policy "orders_update_repartidor" on public.orders
  for update to authenticated
  using (
    public.current_role() = 'repartidor'
    and (
      courier_id = public.current_courier_id()
      or (status = 'listo' and courier_id is null)
    )
  )
  with check (courier_id = public.current_courier_id());

-- order_status_history: el repartidor registra "en_camino" / "entregado" de sus propios pedidos
create policy "order_status_history_insert_repartidor" on public.order_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.courier_id = public.current_courier_id()
    )
  );

create policy "order_status_history_select_repartidor" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.courier_id = public.current_courier_id()
    )
  );
