# Documentación del Sistema

## Roles Principales y Accesos

### Admin
- Acceso completo.
- Gestión de productos, proveedores, inventarios, facturación, servicios y configuración.
- Puede generar reportes y administrar roles.

### Vendedor
- Puede registrar ventas, gestionar inventarios y facturación.
- Consultar stock y generar presupuestos.

### Invitado
- Consultar productos con precios (sin gestión ni modificaciones).

---

## Flujo General

### 1. Pantalla de Inicio de Sesión
**Ruta:** `/login`
**Descripción:** Los usuarios ingresan sus credenciales.

**Post-Login:**
- **Admin:** Redirige al Dashboard Admin.
- **Vendedor:** Redirige al Panel de Ventas.
- **Invitado:** Redirige al Catálogo de Productos.

---

## 2. Dashboard (Admin)
**Ruta:** `/admin/dashboard`
**Elementos:**
- Resumen de ventas del día actual.
- Calendario (se mostrará eventos importantes, pedidos a proveedores, cierres de caja. Mensual, Semanal y Diario)
- Alertas (stock bajo, pedidos a proveedores, cierre de caja pendiente).
- Acceso rápido a: Inventario, Proveedores, Facturación, Servicios.

---

## 3. Gestión de Productos
**Ruta:** `/admin/products`
**Descripción:**
- Listado de productos con filtros por código, descripción, proveedor.
- Botones para agregar, editar o eliminar productos.
- Alertas automáticas para productos con stock mínimo.

**Flujo:**
1. Admin selecciona producto → Ve detalles → Edita o elimina.
2. Opción de agregar nuevo producto.

---

## 4. Inventario
**Ruta:** `/inventory`
**Descripción:**
- Módulo para ver y actualizar inventarios.
- Función para descontar productos tras ventas.
- Generador de pedidos automáticos a proveedores.

**Flujo:**
1. Vendedor consulta inventario.
2. Admin genera pedidos automáticos si el stock está bajo.
3. Sistema genera pedido para enviar al proveedor (Se abrirá Whatsapp y se pre rellenará un mensaje al número del proveedor).

---

## 5. Facturación
**Ruta:** `/billing`
**Descripción:**
- Registro de ventas y generación de facturas a través de [Afip SDK](https://afipsdk.com/).
- Visualización y exportación de facturas.
- Resumen del cierre de caja (efectivo, tarjeta, transferencia).

**Flujo:**
1. Vendedor registra una venta → Genera factura.
2. Admin revisa facturación diaria → Cierra caja.

---

## 6. Servicios Técnicos
**Ruta:** `/services`
**Descripción:**
- Gestión de servicios técnicos para máquinas.
- Creación de presupuestos (repuestos, mano de obra).

**Flujo:**
1. Vendedor registra un servicio → Agrega repuestos → Genera presupuesto.
2. Admin verifica y guarda el servicio en el historial.

---

## 7. Generador de Promociones y Combos
**Ruta:** `/promotions`
**Descripción:**
- Crear descuentos y combos.
- Definir productos incluidos y porcentajes.
- Generar códigos de descuento.

**Flujo:**
1. Admin crea una promoción → Define productos → Guarda.
2. Vendedor aplica promociones al registrar ventas.

---

## 8. Reportes
**Ruta:** `/reports`
**Descripción:**
- Generación de reportes de ventas, inventarios, y servicios técnicos.
- Exportar en PDF o Excel.

**Flujo:**
1. Admin selecciona rango de fechas → Genera reporte → Descarga.

---

## 9. Notificaciones
**Ruta:** `/notifications`
**Descripción:**
- Sistema centralizado de alertas (stock bajo, cierre de caja, pedidos pendientes).

**Flujo:**
1. Notificaciones se muestran en el dashboard y en un ícono global.
2. Admin/Vendedor interactúa con las alertas → Marca como resueltas.

---

## 10. Configuración
**Ruta:** `/settings`
**Descripción:**
- Gestión de permisos de usuarios.
- Modificación de precios y configuraciones generales.

**Flujo:**
1. Admin accede → Modifica configuraciones → Guarda.
