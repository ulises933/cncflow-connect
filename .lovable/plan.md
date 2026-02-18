

# Plan: Completar ERP CNC - Sistema 100% Funcional

## Diagnostico de Problemas Encontrados

Despues de revisar todos los modulos, se identificaron las siguientes carencias funcionales:

---

## Modulo por Modulo: Correcciones y Mejoras

### 1. Compras (Gaps Criticos)
- No se pueden agregar items a una Orden de Compra (no hay dialog de detalle)
- No se actualiza inventario al marcar "Recibido"
- No se puede generar OC desde un BOM
- **Fix:** Agregar dialog de detalle con items, logica de actualizacion de inventario al recibir, y boton "Generar OC" en BOM

### 2. BOM
- No hay boton para generar Orden de Compra desde materiales faltantes
- No hay actualizacion del costo total al agregar/eliminar items
- **Fix:** Agregar boton "Generar OC", recalcular costo total automaticamente

### 3. Inventario
- No hay filtros por tipo (materia prima, WIP, terminado)
- No hay boton de eliminar material
- La logica de "Critico" vs "Bajo" esta invertida (stock < min*1.5 muestra "Critico" pero stock < min muestra "Bajo")
- **Fix:** Agregar filtros, delete, corregir logica de alertas

### 4. Calidad
- No hay formulario para definir tolerancias y caracteristicas en la inspeccion
- Las tolerancias/caracteristicas se almacenan como JSONB pero no hay UI para agregarlas
- **Fix:** Agregar seccion dinamica para agregar tolerancias (nombre, nominal, min, max) y caracteristicas criticas

### 5. Gastos
- No hay editar ni eliminar gastos
- No hay resumen por categoria (grafico o tarjetas)
- **Fix:** Agregar CRUD completo y tarjetas de resumen por categoria

### 6. Recursos Humanos
- No hay eliminar empleado
- No hay toggle de status (activo/inactivo)
- No hay indicadores de desempeno (historial de produccion por operador)
- **Fix:** Agregar delete, status toggle, y seccion de metricas basada en registros_produccion

### 7. Mantenimiento
- No se puede editar un registro existente
- No hay historial agrupado por maquina
- **Fix:** Agregar edicion inline y vista agrupada

### 8. Produccion
- No hay barra de progreso basada en procesos completados
- No hay boton para eliminar procesos
- No se puede eliminar una orden
- **Fix:** Calcular progreso real desde procesos, agregar delete

### 9. Maquinas
- No hay vista de detalle con historial de ordenes y registros
- OEE es estatico (campos en la tabla), no se calcula desde registros reales
- **Fix:** Agregar dialog de detalle con historial, y calculo de OEE real desde registros_produccion

### 10. Vista Operador
- No se selecciona el proceso especifico (solo la orden)
- No hay cronometro / tiempo transcurrido visible
- **Fix:** Agregar selector de proceso y timer en pantalla

### 11. Dashboard
- Faltan graficas de produccion diaria y scrap por dia
- No hay analisis de costos reales vs cotizados
- **Fix:** Agregar grafica de tendencia diaria y tarjetas de analisis financiero

### 12. Cotizaciones
- Al eliminar un item no se recalculan los totales automaticamente
- **Fix:** Recalcular subtotal/iva/total al eliminar item

---

## Hooks Faltantes

Se necesitan agregar los siguientes hooks en `useSupabaseData.ts`:

- `useDeleteInventario` - eliminar material
- `useDeleteGasto` - eliminar gasto  
- `useUpdateGasto` - editar gasto
- `useDeleteEmpleado` - eliminar empleado
- `useDeleteOrdenProduccion` - eliminar orden
- `useDeleteProceso` - eliminar proceso
- `useDeleteMantenimiento` - eliminar registro
- `useUpdateBom` - actualizar BOM (costo total)
- `useDeleteOrdenCompra` - eliminar OC
- `useOrdenCompra` (detalle con items) - ver OC individual
- `useRegistrosPorMaquina(maquinaId)` - historial por maquina
- `useRegistrosPorOperador(nombre)` - historial por operador

---

## Flujos de Negocio Pendientes

### Flujo: BOM a Orden de Compra
1. En la vista de detalle del BOM, agregar boton "Generar Orden de Compra"
2. Al hacer clic, se crea una OC con los items del BOM como items de la OC
3. Se selecciona proveedor

### Flujo: Recepcion de Compra a Inventario  
1. Al cambiar status de OC a "recibido", buscar items de la OC
2. Para cada item, buscar en inventario por nombre/codigo
3. Si existe, sumar stock; si no, crear nuevo registro

### Flujo: Calidad con Tolerancias
1. Al crear inspeccion de primera pieza, permitir agregar N tolerancias
2. Cada tolerancia tiene: nombre, valor nominal, minimo, maximo
3. Se guardan en JSONB y se muestran en el detalle

---

## Detalles Tecnicos

### Archivos a modificar:
- `src/hooks/useSupabaseData.ts` - agregar ~12 hooks faltantes
- `src/pages/Compras.tsx` - reescribir con detalle de OC + items + recepcion
- `src/pages/BOM.tsx` - agregar boton generar OC + recalculo costos
- `src/pages/Inventario.tsx` - filtros + delete + corregir alertas
- `src/pages/Calidad.tsx` - formulario de tolerancias + caracteristicas
- `src/pages/Gastos.tsx` - CRUD completo + resumen por categoria
- `src/pages/RecursosHumanos.tsx` - delete + status + metricas
- `src/pages/Mantenimiento.tsx` - edicion + historial
- `src/pages/Produccion.tsx` - progreso real + delete proceso
- `src/pages/Maquinas.tsx` - detalle con historial
- `src/pages/OperadorView.tsx` - selector proceso + timer
- `src/pages/Dashboard.tsx` - graficas adicionales + finanzas
- `src/pages/Cotizaciones.tsx` - recalculo al eliminar item

### No se requieren cambios en la base de datos
El esquema actual ya soporta toda la funcionalidad pendiente. Los campos JSONB para tolerancias y caracteristicas ya existen en `inspecciones_calidad`.

