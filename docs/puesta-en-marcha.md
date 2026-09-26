# Guía de despliegue y puesta en marcha — All Fashion

Estado al 26/09/2026. Esta guía describe los próximos pasos; no confirma que el despliegue, la homologación o la instalación del cliente ya estén hechos.

El objetivo es publicar la nueva caja y etiquetas, conectar ARCA con datos reales y dejar operativas las dos impresoras en Windows, sin licencias pagas de impresión. Publicar la web no activa por sí solo la facturación fiscal ni configura la PC.

La etiquetadora ya está instalada y funciona correctamente en Windows, según confirmó el usuario. Se conserva su configuración actual; solo falta comprobar el acceso y la impresión desde la nueva sección de vendedores.

## 1. Reunir los datos pendientes

| Dato | Quién lo confirma | Para qué se necesita |
| --- | --- | --- |
| CUIT, razón social, domicilio fiscal, IIBB e inicio de actividades | Cliente/contador | Datos del emisor |
| Condición fiscal definitiva | Contador | Elegir comprobantes y tratamiento de IVA; RI todavía es una suposición |
| Número de punto de venta y habilitación para Web Services | Cliente/contador | El punto existente debe ser compatible con esta integración |
| Sistemas que ya emiten en ese punto | Cliente | Evitar que dos sistemas compitan por la numeración; reservar un punto exclusivo para la app |
| Autorización para factura A estándar, si corresponde | Contador | No habilitar A por suposición |
| Alícuotas, otros tributos y tratamiento de intereses/recargos | Contador | Confirmar que el negocio entra en el alcance fiscal implementado |
| Modelo exacto de Epson, ancho de papel y conexión | Cliente | Driver y prueba de tickets; se preparó formato 80 mm |
| Etiquetadora | Confirmada operativa por el cliente | Conservar instalación y ajustes; verificar que el formato conservado de 50 × 30 mm salga igual desde la nueva sección |
| Versión de Windows y navegador/perfil de caja | Cliente | Instalación, permisos y selección local de la ticketera |
| Hosting del backend, acceso a secretos y política de suspensión | Responsable del despliegue | Firma, certificados y procesamiento de pendientes |

La clave fiscal personal no se carga en la app ni se comparte por chat. El titular o autorizado gestiona los accesos de ARCA; el servidor usa certificado y clave de la integración.

## 2. Confirmar qué significa «operar todo completo»

| Área | Estado actual | Condición para usarla |
| --- | --- | --- |
| Nueva caja, dólar, pagos, promociones y combos | Implementados y probados localmente | Validación del despliegue y de la configuración comercial |
| Etiquetas para vendedores | Implementadas; impresora ya instalada y funcionando | Comprobar impresión y lectura desde la nueva sección con usuario vendedor |
| Tickets | Implementados | Driver Epson, QZ, certificado propio y prueba desde el sitio publicado |
| Facturas A/B/C | Integración implementada, sin homologación real realizada | Datos correctos, certificados ARCA y pruebas de homologación |
| Notas de crédito y débito fiscales | **Pendientes de desarrollo** | Completar antes de considerar cerrado el circuito de devoluciones/ajustes fiscales |
| Facturación de planes con interés | **Bloqueada actualmente** | Definir el tratamiento con el contador e implementarlo |
| Conversión de remito desde la tabla de la interfaz | **Acción pendiente** | Completar la interfaz; hay ruta de backend y pruebas de conversión en efectivo |
| Múltiples alícuotas, otros tributos, servicios, exportación o CAEA | **Fuera del alcance actual** | Si el negocio los necesita, ampliar antes de habilitar su facturación |

El alcance fiscal actual es venta de bienes en pesos; para RI, precios finales con una alícuota uniforme y sin otros tributos. No confirmar ese perfil solo para superar una validación. Los productos valuados en USD se convierten a ARS con la lógica comercial existente.

Un comprobante interno X **no es una factura fiscal**. Mientras esta integración esté deshabilitada, mantener el mecanismo de facturación válido que ya utiliza el negocio. No usar comprobantes internos como sustituto fiscal.

## 3. Preparar la publicación

Responsable: desarrollo/despliegue.

- [ ] Identificar una versión de entrega en **ambos** repositorios: `all-fashion-app` e `inventory-backend`. Guardar también qué versión está desplegada actualmente.
- [ ] Hacer respaldo recuperable de Mongo antes del cambio y comprobar cómo se restauraría en un entorno separado.
- [ ] Repetir los controles de la versión exacta a publicar: frontend `npm test` y `npm run build`; backend `npm test`. Último resultado local registrado: 37 pruebas frontend y 80 backend aprobadas.
- [ ] Comprobar una instalación limpia con el gestor/lockfile que use el hosting. El frontend declara Yarn 1 y existen locks de Yarn/npm: no improvisar cambios de gestor durante el deploy.
- [ ] Registrar los errores TypeScript preexistentes: el build actual pasa, pero no equivale a un chequeo completo limpio de tipos. Resolverlos o dejarlos identificados como deuda de la entrega, sin ocultar errores nuevos.
- [ ] Acordar una ventana corta sin cobros para cambiar backend/frontend y recargar todas las pestañas de caja. No dejar ventas en curso durante el cambio de contrato de API.
- [ ] Usar un entorno de pruebas con base separada para homologación y pruebas destructivas. No ejecutar el sandbox, seeds, ventas ficticias ni tests contra Mongo de producción.

### Plantillas para completar

- Frontend: `.env.example` en `all-fashion-app`.
- Backend: `.env.example` en `inventory-backend`, con primer despliegue fiscal deshabilitado.
- Solo variables fiscales adicionales: `.env.arca.example` en `inventory-backend`.

Los archivos contienen ejemplos y campos vacíos. Conservar los secretos existentes del hosting; no sustituirlos por los textos ilustrativos.

### Configuración del frontend

| Variable | Valor esperado |
| --- | --- |
| `VITE_API_BASE_URL` | URL HTTPS pública del backend **incluyendo `/api`**, por ejemplo `https://<backend>/api` |
| `VITE_SOCKET_URL` | URL HTTPS pública del backend, normalmente **sin `/api`**, por ejemplo `https://<backend>` |

Vite incorpora estas variables al construir: si cambian, reconstruir y publicar. Ningún secreto ni clave privada debe ir en variables `VITE_`. Conservar las rutas SPA de `vercel.json` para poder abrir directamente `/labels`, `/billing` y `/printing-settings`.

### Configuración del backend

Conservar `MONGO_URI`, `JWT_SECRET`, `PORT` y la configuración operativa existente. Revisar `ALLOWED_ORIGINS` con el dominio real del frontend y `CRON_SECRET` si se usa el mantenimiento diario de cotizaciones/cuotas. No copiar los valores del sandbox.

Mongo debe admitir transacciones. Verificar los índices de los modelos `Sale`, `FiscalInvoice`, `FiscalSequence`, `ArcaAuthTicket` y el índice único `ProductBarcode.normalizedValue`. Si el despliegue deshabilita creación automática de índices, crearlos de forma controlada antes de habilitar uso concurrente; no borrar índices ni datos para resolver errores a ciegas.

El backend inicia la cola fiscal después de conectar a Mongo. **Un hosting que suspende el proceso no garantiza reintentos mientras está dormido.** Confirmar una ejecución persistente para la operación esperada. Un ping de salud no reemplaza esa garantía. La preferencia de costo cero no permite prometer disponibilidad de un plan gratuito no verificado.

Las credenciales ARCA y QZ se montan como archivos secretos durables en el servidor. Comprobar que existan después de reiniciar o redesplegar, con permisos de lectura para el proceso. Mantenerlos fuera del repositorio y de los logs.

## 4. Primer deploy: fiscal deshabilitado

Publicar el backend primero y después el frontend, dentro de la ventana acordada. Estado inicial para la emisión fiscal:

```dotenv
ARCA_ENABLED=false
ARCA_PRODUCTION_ENABLED=false
```

Las demás variables fiscales se preparan a partir de `inventory-backend/.env.arca.example`, sin inventar CUIT ni punto de venta en producción.

- [ ] Backend inicia sin errores y `GET /api/maintenance/health` responde. Este endpoint verifica que el proceso responde; **no certifica conexión con ARCA**.
- [ ] Login de administrador y vendedor desde la URL definitiva; sin errores de CORS ni llamadas a localhost.
- [ ] Caja, inventario y saldos existentes se consultan correctamente.
- [ ] El vendedor ve Etiquetas y no ve Configuración de impresión ni obtiene permisos de edición de productos.
- [ ] El administrador puede abrir `/printing-settings`.
- [ ] Revisar una venta sin confirmarla: productos, precios USD, recargos y totales esperados. Cancelar el borrador de prueba.
- [ ] Confirmar que las facturas históricas sin `FiscalInvoice` no se reemitan automáticamente. Requieren revisión/migración de sus CAE y datos guardados.

No habilitar ARCA real todavía. Los controles con cobros ficticios y recuperación de errores se hacen en la base de pruebas.

## 5. Conectar y probar ARCA en homologación

Responsables: desarrollo + titular/autorizado + contador.

ARCA separa certificados de homologación y producción. Para testing usa WSASS; para producción, Administración de Certificados Digitales y Administrador de Relaciones de Clave Fiscal. Asociar el certificado al servicio de facturación correspondiente. [Certificados oficiales ARCA](https://www.arca.gob.ar/ws/documentacion/certificados.asp), [autenticación WSAA](https://arca.gob.ar/ws/documentacion/wsaa.asp).

Configurar **en el entorno de pruebas**:

```dotenv
ARCA_ENVIRONMENT=homologation
ARCA_ENABLED=true
ARCA_PRODUCTION_ENABLED=false
```

Completar CUIT/punto de venta y los archivos de homologación en `ARCA_CERT_PATH` / `ARCA_KEY_PATH`. Configurar condición fiscal, alícuota, autorización A cuando corresponda, umbral vigente de identificación de consumidor final y datos legales del emisor. Para RI, `ARCA_TAX_PROFILE=SINGLE_RATE_NO_OTHER_TAXES` únicamente si el contador confirmó ese perfil.

`GET /api/fiscal/config` permite revisar configuración, pero no prueba por sí solo WSAA/WSFE. La aceptación requiere emisiones reales **del ambiente de homologación**, consultadas nuevamente y con comprobante renderizado:

- [ ] Factura B y A si corresponde al emisor; C solo si corresponde a su condición fiscal.
- [ ] Receptor correcto, IVA, descuentos, redondeos, pagos y total coinciden con la venta.
- [ ] Producto USD factura el importe esperado en ARS.
- [ ] Un doble clic o respuesta perdida no duplica venta, movimiento de caja, stock ni CAE.
- [ ] Una respuesta incierta se recupera con la misma operación/número. Un rechazo definitivo se corrige desde su estado, sin volver a cobrar.
- [ ] Reiniciar el backend conserva y procesa los pendientes; comprobar reintento automático, no solo el botón manual.
- [ ] Reimprimir no vuelve a emitir ni altera datos comerciales.
- [ ] El contador revisa los datos y la representación final del comprobante.

No cambiar jobs de homologación a producción ni intentar convertir un CAE ficticio en uno real. La demo local simula ARCA y no sustituye estos pasos.

## 6. Preparar impresión gratuita de tickets

Responsable: instalación/desarrollo. Esto aplica solo a la Epson; las etiquetas no necesitan QZ.

QZ permite impresión silenciosa con certificado propio confiado en cada PC, sin comprar su certificado comercial. Es una opción documentada, pero requiere instalación y renovación propias. [FAQ oficial de QZ](https://qz.io/docs/faq), [firma y configuración de confianza](https://qz.io/docs/signing).

- [ ] Generar un certificado de firma propio para la integración y registrar su fecha de vencimiento/responsable de renovación. No reutilizar las demo keys de esta Mac.
- [ ] Configurar la confianza específica en QZ de la PC del cliente mediante su mecanismo oficial; no desactivar las verificaciones de seguridad.
- [ ] Montar certificado público y clave privada en el backend. Completar `QZ_CERTIFICATE_PATH` y `QZ_PRIVATE_KEY_PATH`. La clave privada nunca llega al frontend ni se copia a la PC para firmar desde el navegador.
- [ ] Validar firma desde la web HTTPS publicada, con sesión vendedor. Eliminar avisos recurrentes de autorización mediante la configuración de confianza, no ocultándolos en la interfaz.
- [ ] Reiniciar backend y Windows y repetir la prueba.

Los certificados QZ y ARCA son distintos. No se incorporan licencias pagas de impresión; hosting, dominio, base de datos y disponibilidad del servidor se revisan aparte.

## 7. Instalar en la PC Windows del cliente

1. Revisar únicamente la instalación de la Epson: confirmar modelo/conexión, instalar su driver oficial si falta y probarla desde Windows. La etiquetadora ya está operativa y no requiere reinstalación.
2. Mantener la **etiquetadora predeterminada** y conservar sus ajustes actuales de papel, tamaño y calibración.
3. Configurar papel/márgenes/corte de la Epson. Instalar QZ y asegurar que arranque con la sesión de Windows.
4. Abrir la app en el navegador/perfil que usará el vendedor. Entrar como administrador → Configuración de impresión → elegir la ticketera.
5. Cerrar la sesión de administrador y entrar como vendedor **en el mismo perfil del navegador**. La elección de ticketera se guarda por navegador; no viaja con el usuario entre computadoras.
6. Desde Etiquetas, imprimir por la ventana nativa. Revisar el destino del diálogo: el navegador puede recordar una selección anterior. Usar tamaño real (100 %) y confirmar que cada página corresponde a una etiqueta.
7. Desde un comprobante de prueba del entorno adecuado, usar «Imprimir ticket». Debe salir por la Epson aunque la predeterminada de Windows sea la etiquetadora.
8. Imprimir una etiqueta, escanearla y comprobar que carga el producto correcto y **una unidad**. Probar también un código de fabricante y un código interno.
9. Probar tildes, nombre largo, precio USD, dos copias, lote corto, QR del ticket y ticket largo. Revisar legibilidad, márgenes y corte.
10. Probar falta de papel y desconexión; revisar la cola antes de reenviar. «Enviado a imprimir» no demuestra que salió papel.
11. Reiniciar Windows y repetir etiquetas y ticket con usuario vendedor. Ese reinicio forma parte de la aceptación.

No hace falta instalar Node, Mongo ni herramientas de desarrollo en la PC de caja. Necesita navegador, drivers, QZ para tickets y conexión con la app/backend.

## 8. Habilitar producción fiscal

Solo después de completar homologación, validar el alcance con el contador y resolver los desarrollos que el negocio necesite para operar completo.

- [ ] Certificado de **producción** y acceso al servicio autorizados.
- [ ] CUIT, punto de venta exclusivo, condición fiscal y datos legales verificados.
- [ ] No hay otro sistema emitiendo sobre la misma serie de esta integración.
- [ ] Backend persistente y secretos verificados tras reinicio.
- [ ] Impresión física aprobada y vendedor capacitado.
- [ ] Canal de soporte y mecanismo de contingencia fiscal acordados con el contador.

Configurar conjuntamente en el backend de producción y reiniciarlo:

```dotenv
ARCA_ENVIRONMENT=production
ARCA_ENABLED=true
ARCA_PRODUCTION_ENABLED=true
```

Usar los archivos de producción, no los de homologación. Registrar la primera **venta legítima** con el responsable presente; comprobar total, número, CAE, vencimiento, stock, caja y ticket. Una factura de producción no es una prueba descartable. No emitir ventas ficticias «para ver si funciona».

## 9. Operación diaria y recuperación

| Situación | Acción del operador |
| --- | --- |
| Se perdió la respuesta del cobro | Usar «Consultar y recuperar cobro» en la misma operación; no iniciar otra venta |
| La pestaña original se perdió | Buscar primero la venta en el historial antes de volver a cobrar |
| Venta guardada con factura pendiente | Recuperar autorización desde su detalle; no recrear la venta |
| Rechazo fiscal | Corregir los datos permitidos desde el comprobante rechazado |
| Número reservado no coincide con lo consultado | Escalar a soporte; no borrar reservas ni asignar números manualmente |
| No salió papel | Revisar dispositivo y cola; reimprimir el comprobante existente, sin emitir otro |
| Necesita devolver/anular una factura | Usar el circuito fiscal acordado; la cancelación interna no sustituye una nota de crédito |

Al abrir/cerrar caja: revisar pendientes fiscales, transferencias por verificar y saldos. Mantener el mantenimiento diario de cotizaciones/cuotas configurado y comprobar sus resultados. Registrar errores con identificador de venta y hora, sin incluir claves ni certificados privados.

Si hay un incidente después del deploy, pausar nuevas emisiones y evaluar el retorno a una versión compatible. **No restaurar una base antigua ni borrar ventas/CAE como rollback rutinario:** ARCA y los cobros reales no se deshacen al revertir código. Conservar los registros y conciliar operaciones antes de reanudar.

## Condición de entrega

Se considera operativo el alcance acordado cuando una sesión de vendedor, en Windows y desde la URL final, completa venta → autorización real → ticket, y etiquetas → impresión nativa → lectura correcta, con reinicio y recuperación comprobados.

Mientras estén pendientes notas de crédito/débito, financiación fiscal o cualquier tratamiento tributario que el negocio necesite, no presentar el sistema como «todo el circuito fiscal completo». Registrar esos pendientes y completarlos antes de sustituir por entero el sistema fiscal actual.
