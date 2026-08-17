revoke execute on function public.queue_expiry_alerts(integer) from anon, authenticated;
grant execute on function public.queue_expiry_alerts(integer) to service_role;
