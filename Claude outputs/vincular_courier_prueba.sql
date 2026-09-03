-- Datos de prueba (no es RLS, no cambia permisos).
-- Corre esto después de rls_fase4_repartidor.sql.

-- 1) Crea la fila de repartidor vinculada al perfil de repartidor@test.com.
--    Ajusta el email si usas otra cuenta de prueba.
insert into public.couriers (profile_id, status, vehicle, distance_km, rating)
select id, 'disponible', 'Moto', 3, 4.8
from public.profiles
where role = 'repartidor'
  and auth_user_id = (select id from auth.users where email = 'repartidor@test.com')
on conflict do nothing;

-- 2) Como el dashboard del restaurante todavía no está conectado a Supabase
--    (sigue con datos de ejemplo), ningún pedido real avanza solo hasta "listo".
--    Para probar la vista de repartidor, mueve un pedido tuyo de prueba a "listo" a mano:
--    reemplaza 'FP-XXXXXX' por el order_number que te mostró la pantalla de confirmación.
update public.orders
set status = 'listo'
where order_number = 'FP-XXXXXX';

insert into public.order_status_history (order_id, status)
select id, 'listo' from public.orders where order_number = 'FP-XXXXXX';
