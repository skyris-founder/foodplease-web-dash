-- Datos de prueba (no es RLS, no cambia permisos).
-- Corre esto después de rls_fase5_restaurante.sql.

-- 1) Revisa qué restaurantes existen y cuál quieres vincular a tu cuenta de prueba.
select id, name, owner_id from public.restaurants order by name;

-- 2) Vincula ese restaurante al perfil de restaurante@test.com.
--    Reemplaza 'NOMBRE_DE_TU_RESTAURANTE' por el name exacto que viste arriba
--    (o usa el id directamente si prefieres).
update public.restaurants
set owner_id = (
  select p.id
  from public.profiles p
  where p.role = 'restaurante'
    and p.auth_user_id = (select id from auth.users where email = 'restaurante@test.com')
)
where name = 'NOMBRE_DE_TU_RESTAURANTE';

-- 3) Verifica que quedó vinculado.
select id, name, owner_id from public.restaurants where name = 'NOMBRE_DE_TU_RESTAURANTE';
