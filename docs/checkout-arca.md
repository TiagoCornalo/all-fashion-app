# Venta, ARCA e impresión — auditoría e implementación

Fecha: 26/09/2026. Cambios locales en `all-fashion-app` y en el repositorio hermano `inventory-backend`. No se desplegaron cambios ni se registraron ventas en la sesión real de Chrome.

## Qué cambió

La caja reúne productos, combos, promociones, pagos y comprobante en una pantalla. «Revisar y continuar» consulta precios y reglas en el servidor. «Confirmar venta» registra una operación identificada, que se puede recuperar si se pierde la respuesta. Una venta guardada tiene su propio resultado, independiente de ARCA y de la impresora.

El servidor guarda venta, stock, caja, deuda, promociones y solicitud fiscal en una transacción Mongo. Después un procesador autoriza la factura. Guarda el número y los datos enviados antes de llamar a ARCA. Ante una respuesta incierta consulta ese número, compara los datos y recupera la autorización. No avanza la numeración mientras un comprobante de esa serie necesita conciliación. Los rechazos definitivos admiten corrección de datos con historial; no se pueden editar autorizaciones ni resultados inciertos.

La autenticación WSAA usa credenciales temporales compartidas en Mongo y una reserva entre procesos. No depende de escribir tickets dentro de `node_modules`. La clave y el certificado fiscal permanecen en el servidor. Se usa el contrato SOAP actual de WSFE, porque el WSDL incluido en la dependencia anterior omitía `CondicionIVAReceptorId`.

## Reglas relevadas y preservadas

| Área | Comportamiento y comprobación |
| --- | --- |
| Dólar | Blue, oficial, MEP y tarjeta. Fórmula existente: USD × (cotización + ajuste en pesos por dólar). Venta/factura en ARS; conserva la cotización histórica. Consulta de venta sin actualización masiva de productos fuera de la transacción. |
| Cambios de precio | Revisión y confirmación calculan con el mismo servicio. Si cambian precios, dólar, recargos o financiación, se exige revisar nuevamente. |
| Tarjetas | Recargo del banco activo, sobre la parte asignada a esa tarjeta. El campo editable representa importe base. |
| Transferencia | Se preserva el recargo configurado sobre todo el subtotal si hay transferencia, con mínimo y tope. Exige teléfono y confirmación de envío del comprobante. La verificación posterior continúa separada. |
| Cuenta corriente | Solo se financia la parte asignada a cuenta corriente; cuotas y último centavo, frecuencia y límite de crédito. La deuda no entra en el saldo de caja. |
| Promociones | Por producto y luego global, sin aplicar la global a combos. Valida disponibilidad en servidor. Los usos y datos de cliente se guardan al confirmar, dentro de la transacción. |
| Combos | Precio del servidor; suma sus componentes al stock de los productos individuales para impedir sobreventa. Conserva componentes para cancelación. |
| Caja | Usa la caja seleccionada y comprueba que siga abierta. Se conservan pedidos automáticos y alertas de reposición. |
| Cancelación interna | Restaura stock y caja una sola vez. Revierte también intereses de la financiación y archiva el plan cancelado para evitar cuotas pendientes ficticias. |
| Remitos | La conversión conserva el precio acordado y registra la solicitud fiscal en su transacción. Prueba de conversión en efectivo. La acción «convertir» de la tabla de remitos ya estaba pendiente de implementación en el frontend; no se presenta como un flujo nuevo terminado. |
| Lector | No interpreta DNI/teléfono como códigos; serializa búsquedas de escaneo y se suspende durante revisión/guardado. |
| Impresión | Ticket 80 mm y A4/PDF desde el navegador; QZ Tray con impresora seleccionada. Reimprimir no registra una venta ni solicita otro CAE. |

## Problemas corregidos

- CAE solicitado dentro de la transacción de venta y respuesta dependiente de generar un PDF.
- Doble operación posible al reintentar un cobro sin identificador persistente.
- Hook del modelo que reemplazaba el total por el subtotal y eliminaba recargos al guardar nuevamente.
- Errores de cuenta corriente absorbidos después de modificar venta/stock.
- Precios de combos y descuentos enviados por el cliente aceptados como fuente de verdad.
- Consumo de promociones al validarlas, aun sin venta confirmada.
- Importes/bancos antiguos tras deseleccionar pagos e índices de promociones incorrectos al borrar productos.
- Cuotas calculadas sobre el total de una venta mixta y datos de financiación perdidos al editar cliente.
- Autenticación fiscal y numeración sin coordinación durable entre procesos.

## Verificación

Resultado final después de la segunda revisión: 80 pruebas de servidor y 37 pruebas de interfaz aprobadas. Build de producción aprobado.

Pruebas del servidor: `cd ../inventory-backend && npm test`. MongoMemoryReplSet crea una base temporal en loopback; no carga `.env` ni usa Mongo de producción. Incluye concurrencia sobre última unidad, reintentos, respuesta perdida del commit Mongo, stock compartido, IVA A/B/C, validación de CUIT, colas fiscales, correcciones, cotizaciones, deuda, cancelación, remito y firma QZ con certificado efímero. Un contrato WSFE oficial guardado como fixture verifica que el XML incluya la condición IVA del receptor. No hace una autorización real.

Pruebas de interfaz: `npm test`. Comprueban revisión obligatoria, invalidación al editar, recuperación con la misma clave tras remontar la pantalla, diferencia en pagos, confirmación de transferencia, promociones actualizadas por el servidor, lector, cuotas y restauración de datos del cliente.

`npm run build` pasa. La comprobación TypeScript completa con `tsc -p tsconfig.app.json --noEmit` encuentra problemas anteriores del repositorio; el comando de build existente no ejecuta esa comprobación completa. No se declara que el repositorio esté libre de errores de tipos.

En Chrome se comprobó con datos ficticios: producto agotado deshabilitado; venta USD en pesos con recargo de tarjeta; guardado y vista del ticket; CUIT inválido bloqueado; factura B simulada que pierde la respuesta y recupera el mismo número/CAE. No se enviaron trabajos a una impresora física. La comprobación visual realizada fue de escritorio; el control de tamaño de Chrome no produjo una vista móvil verificable.

## Demo reproducible y aislada

En dos terminales:

```sh
# Repositorio inventory-backend
node tools/checkout-sandbox.js
```

```sh
# Repositorio all-fashion-app
npm run dev -- --host 127.0.0.1 --port 5178
```

Abrir `http://127.0.0.1:5178/qa/checkout.html`. El servidor escucha solo en `127.0.0.1:4418`; la página fuerza esa API y usa una base descartable. ARCA es un simulador dentro de ese script, sin certificados reales. El punto de venta, CUIT, CAE y negocio son ficticios. Cada factura simula primero pérdida de respuesta y permite recuperar la autorización. Al detener el servidor se descarta la base. Esta entrada QA no forma parte del build de producción.

## Windows y Epson USB

1. Confirmar el modelo exacto y ancho de papel; instalar el controlador oficial Epson y verificar una página de prueba en Windows.
2. Instalar QZ Tray desde su sitio oficial y dejarlo abierto en la computadora de caja.
3. Como administrador, abrir Configuración de impresión y elegir la ticketera para esa computadora. En la venta, el vendedor solo usa «Imprimir ticket». Las etiquetas usan la impresión nativa, sin QZ.
4. Probar un ticket largo, tildes, QR legible, márgenes y corte. El controlador de Windows define papel y corte; no se presupone soporte ESC/POS sin validar el modelo.
5. Para impresión sin avisos, configurar certificado confiable QZ y firma en el servidor. Las claves ARCA y QZ son distintas. Sin configuración de confianza QZ muestra sus confirmaciones; permanece disponible «Ver ticket / imprimir».

El éxito de QZ indica entrega al sistema de impresión, no prueba que haya salido papel. Ante un error físico no se reimprime automáticamente, para evitar copias duplicadas.

## Antes de activar facturación real

El usuario confirmó que existe un punto de venta y que la impresora usa Windows. Faltan el número y la condición fiscal definitiva del negocio. Ver `inventory-backend/docs/arca-operations.md` y `.env.arca.example`.

- Confirmar CUIT, condición fiscal, habilitación del tipo A, punto de venta de WSFE y datos del emisor. Reservar una serie/punto de venta exclusivo para esta integración.
- Validar el perfil tributario del catálogo. Esta implementación admite venta de bienes en pesos con una única alícuota de IVA y sin otros tributos. Ese perfil exige una confirmación explícita de configuración; no se asume para el negocio real.
- Los planes con interés siguen disponibles para comprobantes internos. Su emisión fiscal se bloquea hasta definir cómo facturar la financiación. No se omiten intereses silenciosamente.
- No se implementaron notas de crédito/débito fiscales, CAEA/offline, exportación, servicios ni múltiples alícuotas por factura. La cancelación común no permite anular una factura fiscal mediante ajustes de stock/caja.
- Completar homologación real con certificados del negocio y validar representación del comprobante. La simulación y el contrato SOAP no sustituyen esa prueba.
- Validar la Epson física en Windows. No se promete funcionamiento del corte/driver antes de esa prueba.

Fuentes oficiales: [manual WSFE ARCA](https://www.arca.gob.ar/ws/documentacion/manuales/manual-desarrollador-ARCA-COMPG.pdf), [tipos de comprobantes](https://www.arca.gob.ar/facturacion/regimen-general/comprobantes.asp), [datos obligatorios](https://www.arca.gob.ar/fe/emision-autorizacion/datos-comprobantes.asp), [transparencia fiscal](https://www.afip.gob.ar/comunicacion/transparencia-fiscal/), [firmas QZ](https://qz.io/docs/signing).

## Segunda revisión: impresión y acceso de vendedores

La sección `/labels` (Etiquetas de productos) está en el menú de ADMIN, MANAGER y SELLER. Comparte el centro de etiquetas con inventario: buscar por nombre/código, escanear, elegir copias, incluir precio final en ARS, actualizar códigos/precios, ver PDF y reimprimir. La API devuelve solo datos de etiqueta y mantiene restringidas las altas, ediciones y bajas de productos/códigos. Preparar puede crear/reutilizar un código interno estable; no modifica stock.

### Flujo final de impresión

- **Etiquetas:** «Imprimir etiquetas» genera el PDF y solicita el diálogo nativo mediante `autoPrint`, como el flujo anterior. «Ver PDF» abre una vista sin solicitar impresión. No utiliza QZ, no tiene selección de impresoras dentro de la app y no envía documentos al servidor de firma. El navegador/sistema controla el destino del diálogo nativo; puede conservar su última selección.
- **Tickets:** «Imprimir ticket» envía el comprobante a la ticketera configurada previamente por el administrador. No muestra nombres de dispositivos, QZ, USB ni opciones de instalación en la venta. Si falla, muestra un mensaje sencillo y conserva la venta.
- **Configuración:** `/printing-settings`, exclusiva de ADMIN, permite elegir una vez la ticketera por nombre en ese navegador. Los vendedores no ven ese menú. No cambia ni usa como reemplazo la impresora predeterminada de Windows, que puede seguir siendo la etiquetadora. No se guarda un destino de etiquetas en la app.

### Bugs corregidos

- Preparación fallida que dejaba imprimible el lote anterior: se invalida desde el cambio de selección y permite reintento explícito.
- Cantidades fraccionarias y lotes excesivos: copias enteras de 1 a 999, hasta 1000 etiquetas por trabajo, sin límite de reimpresiones posteriores.
- Códigos principales de paquetes elegidos para etiquetas unitarias: se usan códigos de una unidad o un interno estable.
- Generación simultánea del mismo código interno: índice único y actualización atómica.
- Precio redondeado sin centavos y nombres largos invadiendo el código: dos decimales y título acotado a dos líneas.
- Precio USD con fallback silencioso ante un fallo de consulta: preparación usa el servicio de cotización de venta y muestra el fallo.
- Ticketera ausente/renombrada: nunca se reemplaza automáticamente por la predeterminada. No se reintenta automáticamente una impresión que pudo haber salido.

### Verificación

80 pruebas de backend y 37 de frontend aprobadas. Las de impresión verifican tickets con destino explícito, independencia del predeterminado, ausencia de fallback, etiquetas por PDF nativo sin QZ, reimpresión, vista PDF sin impresión automática, ventanas bloqueadas, cantidades, preparación fallida/recuperación, búsqueda, permisos y generación concurrente. Build aprobado; persisten los errores TypeScript previos documentados.

En Chrome se comprobó sobre la base temporal la búsqueda como vendedor y la etiqueta USD $26.000,00. La inspección del PDF blob fue bloqueada por la herramienta del navegador; no se declara verificada visualmente esa salida ni el diálogo nativo. Sin dispositivos conectados no se certifican papel, corte ni lectura física. Demo: `http://127.0.0.1:5178/qa/labels.html`.

### Instalación en la PC del cliente

1. La etiquetadora ya está instalada y funciona, confirmado por el usuario. Conservarla; revisar modelo e instalación de la Epson y agregar su driver oficial solo si falta.
2. Mantener la etiquetadora predeterminada con sus ajustes actuales de papel y calibración. Las etiquetas no necesitan QZ; solo comprobar su impresión desde la nueva sección del vendedor.
3. Configurar papel/corte de la Epson, instalar QZ para los tickets y asegurar su inicio con la sesión de caja. Configurar certificados de firma si se desea evitar avisos de confianza.
4. En el navegador que usarán los vendedores, entrar como administrador → Configuración de impresión → elegir la ticketera. La elección queda en ese perfil de navegador, no se copia desde la Mac.
5. Entrar como vendedor, abrir Etiquetas, imprimir una etiqueta desde la ventana nativa y escanearla: debe identificar el producto y sumar una unidad. Probar precio USD, nombres largos, tamaño real (100 %) y un lote corto.
6. Imprimir tickets cortos y largos con la etiquetadora todavía predeterminada. Revisar tildes, QR, márgenes y corte.
7. Probar falta de papel y desconexión. Una cola puede aceptar trabajos aunque la impresora esté apagada; comprobar salida y resolver la cola antes de reimprimir.
8. Reiniciar Windows y repetir con el usuario vendedor. Completar también la homologación ARCA antes de activar facturación real.
