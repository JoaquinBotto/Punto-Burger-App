import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  const tableCode = process.argv[2] || 'mesa-01';
  const db = getDb();

  // 1. Revocar dispositivos activos vinculados a sesiones de la mesa
  await db.execute(sql`
    UPDATE devices 
    SET status = 'revoked', revoked_at = NOW() 
    WHERE table_session_id IN (
      SELECT id FROM table_sessions 
      WHERE table_id IN (SELECT id FROM tables WHERE code = ${tableCode})
    ) AND status = 'active'
  `);

  // 2. Cerrar sesiones activas
  await db.execute(sql`
    UPDATE table_sessions 
    SET status = 'closed', closed_at = NOW(), cooldown_until = NULL, active_device_id = NULL 
    WHERE table_id IN (SELECT id FROM tables WHERE code = ${tableCode}) 
      AND status = 'active'
  `);

  // 3. Poner mesa en disponible
  await db.execute(sql`UPDATE tables SET status = 'available' WHERE code = ${tableCode}`);

  // 4. Limpiar cooldown y active_device_id en sesiones cerradas
  await db.execute(sql`
    UPDATE table_sessions 
    SET cooldown_until = NULL, active_device_id = NULL 
    WHERE table_id IN (SELECT id FROM tables WHERE code = ${tableCode}) 
      AND status = 'closed'
  `);

  console.log(`Table ${tableCode} reset to available with 0 active sessions and 0 active devices.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
