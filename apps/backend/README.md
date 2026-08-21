# Alpha Appointment API

Run the compatible auth migration once before enabling login:

```bash
psql "$DATABASE_URL" -f database/auth-rbac-migration.sql
```

The migration only adds nullable/defaulted authentication columns and an email index. It does not rename, delete, or change any n8n-facing table or column.

Set `DATABASE_URL` and `JWT_SECRET`, then run `npm run dev:backend` from the repository root. The API listens at `http://localhost:5000`, with Swagger at `/swagger`.

Roles:

- `superadmin`: global tenant onboarding and global appointment feed.
- `tenant_admin` and `tenant_user`: only their own tenant routes.

Availability is tenant-managed through `GET` and `PUT /api/tenants/{tenantId}/availability`. Tenants set their IANA time zone, recurring weekly working hours, appointment length, and dated holidays. The backend generates the next 90 days of free `availability_slots` from those rules and preserves booked slots.
