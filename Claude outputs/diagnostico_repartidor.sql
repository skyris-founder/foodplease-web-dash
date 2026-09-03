-- Solo lectura, no cambia nada. Corre las 4 y pégame los resultados.

-- 1) ¿El perfil de repartidor@test.com tiene fila en couriers?
select p.id as profile_id, p.name, p.role, c.id as courier_id, c.status, c.vehicle
from public.profiles p
left join public.couriers c on c.profile_id = p.id
where p.role = 'repartidor';

-- 2) Todos los repartidores que existen (para ver a cuál le asignaste el pedido)
select c.id as courier_id, c.profile_id, c.status, c.vehicle, p.name
from public.couriers c
left join public.profiles p on p.id = c.profile_id;

-- 3) ¿Ya existen las políticas de la fase 4 (repartidor) sobre "couriers"?
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'couriers';

-- 4) El pedido que asignaste: ¿a qué courier_id quedó?
select id, order_number, status, courier_id
from public.orders
where courier_id is not null
order by created_at desc
limit 5;
