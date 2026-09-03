-- Solo lectura, no cambia nada. Corre las 3 y pégame los resultados.

-- 1) ¿A qué restaurante está vinculado el perfil de restaurante@test.com?
select p.id as profile_id, p.name, r.id as restaurant_id, r.name as restaurant_name, r.owner_id
from public.profiles p
left join public.restaurants r on r.owner_id = p.id
where p.role = 'restaurante';

-- 2) El/los pedidos más recientes: ¿a qué restaurant_id quedaron asociados?
select id, order_number, restaurant_id, customer_id, status, created_at
from public.orders
order by created_at desc
limit 5;

-- 3) ¿Ya existen las políticas de la fase 5 (restaurante) sobre "orders"?
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'orders';
