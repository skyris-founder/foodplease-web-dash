-- Fase 3 — permite que un cliente cree su propio pedido y lo pueda leer después.
-- Necesario para el carrito / checkout (pago simulado) en /cliente.
-- Aditivo. No borra ni modifica tablas, columnas ni datos existentes.
-- Usa current_profile_id() ya creada en rls_fase1_final.sql.
--
-- Alcance: SOLO el cliente dueño del pedido (customer_id = current_profile_id()).
-- No agrega permisos para restaurante ni repartidor todavía — eso viene cuando
-- conectemos el dashboard del restaurante y la app del repartidor a datos reales.

-- orders: el cliente puede crear e insertar su propio pedido
create policy "orders_insert_own_customer" on public.orders
  for insert to authenticated
  with check (customer_id = public.current_profile_id());

-- orders: el cliente puede leer sus propios pedidos (para confirmación, tracking, historial)
create policy "orders_select_own_customer" on public.orders
  for select to authenticated
  using (customer_id = public.current_profile_id());

-- order_items: el cliente puede insertar los ítems de un pedido que le pertenece
create policy "order_items_insert_own_customer" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_profile_id()
    )
  );

-- order_items: el cliente puede leer los ítems de sus propios pedidos
create policy "order_items_select_own_customer" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_profile_id()
    )
  );

-- order_status_history: el cliente puede insertar el estado inicial ("recibido") de su propio pedido
create policy "order_status_history_insert_own_customer" on public.order_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.customer_id = public.current_profile_id()
    )
  );

-- order_status_history: el cliente puede leer el historial de sus propios pedidos
create policy "order_status_history_select_own_customer" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.customer_id = public.current_profile_id()
    )
  );
