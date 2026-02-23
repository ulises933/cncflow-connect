export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bom: {
        Row: {
          costo_total: number
          cotizacion_id: string | null
          created_at: string
          folio: string
          id: string
          orden_id: string | null
          producto: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          costo_total?: number
          cotizacion_id?: string | null
          created_at?: string
          folio?: string
          id?: string
          orden_id?: string | null
          producto: string
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          costo_total?: number
          cotizacion_id?: string | null
          created_at?: string
          folio?: string
          id?: string
          orden_id?: string | null
          producto?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          bom_id: string
          cantidad: number
          costo_total: number
          costo_unitario: number
          created_at: string
          descripcion: string | null
          especificacion: string | null
          id: string
          lead_time_dias: number | null
          material: string
          numero_parte: string | null
          peso_unitario: number | null
          proveedor_preferido: string | null
          unidad: string
        }
        Insert: {
          bom_id: string
          cantidad?: number
          costo_total?: number
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          especificacion?: string | null
          id?: string
          lead_time_dias?: number | null
          material: string
          numero_parte?: string | null
          peso_unitario?: number | null
          proveedor_preferido?: string | null
          unidad?: string
        }
        Update: {
          bom_id?: string
          cantidad?: number
          costo_total?: number
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          especificacion?: string | null
          id?: string
          lead_time_dias?: number | null
          material?: string
          numero_parte?: string | null
          peso_unitario?: number | null
          proveedor_preferido?: string | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
        ]
      }
      calibraciones: {
        Row: {
          ajuste_realizado: boolean | null
          archivos: string[] | null
          calibrado_por: string | null
          certificado_numero: string | null
          costo: number | null
          created_at: string
          desviacion_encontrada: string | null
          fecha_calibracion: string
          fecha_vencimiento: string
          id: string
          incertidumbre: string | null
          instrumento_id: string
          laboratorio: string | null
          notas: string | null
          patron_referencia: string | null
          resultado: string
        }
        Insert: {
          ajuste_realizado?: boolean | null
          archivos?: string[] | null
          calibrado_por?: string | null
          certificado_numero?: string | null
          costo?: number | null
          created_at?: string
          desviacion_encontrada?: string | null
          fecha_calibracion?: string
          fecha_vencimiento: string
          id?: string
          incertidumbre?: string | null
          instrumento_id: string
          laboratorio?: string | null
          notas?: string | null
          patron_referencia?: string | null
          resultado?: string
        }
        Update: {
          ajuste_realizado?: boolean | null
          archivos?: string[] | null
          calibrado_por?: string | null
          certificado_numero?: string | null
          costo?: number | null
          created_at?: string
          desviacion_encontrada?: string | null
          fecha_calibracion?: string
          fecha_vencimiento?: string
          id?: string
          incertidumbre?: string | null
          instrumento_id?: string
          laboratorio?: string | null
          notas?: string | null
          patron_referencia?: string | null
          resultado?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibraciones_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "instrumentos_medicion"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ciudad: string | null
          codigo_postal: string | null
          condiciones_pago: string | null
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          estado: string | null
          id: string
          industria: string | null
          limite_credito: number | null
          moneda: string | null
          nombre: string
          notas: string | null
          pais: string | null
          razon_social: string | null
          rfc: string | null
          sitio_web: string | null
          telefono: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          codigo_postal?: string | null
          condiciones_pago?: string | null
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          industria?: string | null
          limite_credito?: number | null
          moneda?: string | null
          nombre: string
          notas?: string | null
          pais?: string | null
          razon_social?: string | null
          rfc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          codigo_postal?: string | null
          condiciones_pago?: string | null
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          industria?: string | null
          limite_credito?: number | null
          moneda?: string | null
          nombre?: string
          notas?: string | null
          pais?: string | null
          razon_social?: string | null
          rfc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          acabado_superficial: string | null
          cantidad: number
          costo_hora_maquina: number
          costo_material: number
          cotizacion_id: string
          created_at: string
          descripcion: string
          dimensiones_brutas: string | null
          id: string
          inventario_id: string | null
          material: string | null
          material_grado: string | null
          notas: string | null
          numero_parte: string | null
          numero_plano: string | null
          peso_unitario: number | null
          recubrimiento: string | null
          requiere_certificado: boolean | null
          revision_plano: string | null
          subtotal: number
          tiempo_estimado_hrs: number
          tolerancia_general: string | null
          tratamiento_termico: string | null
          unidad: string
        }
        Insert: {
          acabado_superficial?: string | null
          cantidad?: number
          costo_hora_maquina?: number
          costo_material?: number
          cotizacion_id: string
          created_at?: string
          descripcion: string
          dimensiones_brutas?: string | null
          id?: string
          inventario_id?: string | null
          material?: string | null
          material_grado?: string | null
          notas?: string | null
          numero_parte?: string | null
          numero_plano?: string | null
          peso_unitario?: number | null
          recubrimiento?: string | null
          requiere_certificado?: boolean | null
          revision_plano?: string | null
          subtotal?: number
          tiempo_estimado_hrs?: number
          tolerancia_general?: string | null
          tratamiento_termico?: string | null
          unidad?: string
        }
        Update: {
          acabado_superficial?: string | null
          cantidad?: number
          costo_hora_maquina?: number
          costo_material?: number
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          dimensiones_brutas?: string | null
          id?: string
          inventario_id?: string | null
          material?: string | null
          material_grado?: string | null
          notas?: string | null
          numero_parte?: string | null
          numero_plano?: string | null
          peso_unitario?: number | null
          recubrimiento?: string | null
          requiere_certificado?: boolean | null
          revision_plano?: string | null
          subtotal?: number
          tiempo_estimado_hrs?: number
          tolerancia_general?: string | null
          tratamiento_termico?: string | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          cliente_id: string | null
          condiciones_pago: string | null
          contacto_cliente: string | null
          created_at: string
          fecha: string
          folio: string
          id: string
          iva: number
          margen_porcentaje: number
          moneda: string | null
          notas: string | null
          porcentaje_anticipo: number | null
          referencia_cliente: string | null
          requiere_anticipo: boolean | null
          status: string
          subtotal: number
          tiempo_entrega_dias: number | null
          tipo_cambio: number | null
          titulo: string
          total: number
          updated_at: string
          vendedor: string | null
          vigencia_dias: number | null
        }
        Insert: {
          cliente_id?: string | null
          condiciones_pago?: string | null
          contacto_cliente?: string | null
          created_at?: string
          fecha?: string
          folio?: string
          id?: string
          iva?: number
          margen_porcentaje?: number
          moneda?: string | null
          notas?: string | null
          porcentaje_anticipo?: number | null
          referencia_cliente?: string | null
          requiere_anticipo?: boolean | null
          status?: string
          subtotal?: number
          tiempo_entrega_dias?: number | null
          tipo_cambio?: number | null
          titulo: string
          total?: number
          updated_at?: string
          vendedor?: string | null
          vigencia_dias?: number | null
        }
        Update: {
          cliente_id?: string | null
          condiciones_pago?: string | null
          contacto_cliente?: string | null
          created_at?: string
          fecha?: string
          folio?: string
          id?: string
          iva?: number
          margen_porcentaje?: number
          moneda?: string | null
          notas?: string | null
          porcentaje_anticipo?: number | null
          referencia_cliente?: string | null
          requiere_anticipo?: boolean | null
          status?: string
          subtotal?: number
          tiempo_entrega_dias?: number | null
          tipo_cambio?: number | null
          titulo?: string
          total?: number
          updated_at?: string
          vendedor?: string | null
          vigencia_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      empleados: {
        Row: {
          capacitaciones: Json | null
          certificaciones: Json | null
          contacto_emergencia: string | null
          created_at: string
          curp: string | null
          departamento: string | null
          direccion: string | null
          email: string | null
          fecha_ingreso: string
          fecha_nacimiento: string | null
          id: string
          maquina_id: string | null
          nombre: string
          nss: string | null
          puesto: string
          rfc: string | null
          salario_mensual: number | null
          status: string
          telefono: string | null
          telefono_emergencia: string | null
          tipo_contrato: string | null
          turno: string
          updated_at: string
        }
        Insert: {
          capacitaciones?: Json | null
          certificaciones?: Json | null
          contacto_emergencia?: string | null
          created_at?: string
          curp?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string | null
          id?: string
          maquina_id?: string | null
          nombre: string
          nss?: string | null
          puesto: string
          rfc?: string | null
          salario_mensual?: number | null
          status?: string
          telefono?: string | null
          telefono_emergencia?: string | null
          tipo_contrato?: string | null
          turno?: string
          updated_at?: string
        }
        Update: {
          capacitaciones?: Json | null
          certificaciones?: Json | null
          contacto_emergencia?: string | null
          created_at?: string
          curp?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string | null
          id?: string
          maquina_id?: string | null
          nombre?: string
          nss?: string | null
          puesto?: string
          rfc?: string | null
          salario_mensual?: number | null
          status?: string
          telefono?: string | null
          telefono_emergencia?: string | null
          tipo_contrato?: string | null
          turno?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleados_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
        ]
      }
      especificaciones_gdt: {
        Row: {
          caracteristica: string
          created_at: string
          critica: boolean | null
          datum: string | null
          id: string
          instrumento_requerido: string | null
          metodo_medicion: string | null
          notas: string | null
          numero_plano: string
          orden_id: string | null
          revision: string | null
          simbolo_gdt: string | null
          tipo_tolerancia: string
          tolerancia_inferior: number | null
          tolerancia_superior: number | null
          unidad: string | null
          valor_nominal: number | null
          zona_tolerancia: number | null
        }
        Insert: {
          caracteristica: string
          created_at?: string
          critica?: boolean | null
          datum?: string | null
          id?: string
          instrumento_requerido?: string | null
          metodo_medicion?: string | null
          notas?: string | null
          numero_plano: string
          orden_id?: string | null
          revision?: string | null
          simbolo_gdt?: string | null
          tipo_tolerancia: string
          tolerancia_inferior?: number | null
          tolerancia_superior?: number | null
          unidad?: string | null
          valor_nominal?: number | null
          zona_tolerancia?: number | null
        }
        Update: {
          caracteristica?: string
          created_at?: string
          critica?: boolean | null
          datum?: string | null
          id?: string
          instrumento_requerido?: string | null
          metodo_medicion?: string | null
          notas?: string | null
          numero_plano?: string
          orden_id?: string | null
          revision?: string | null
          simbolo_gdt?: string | null
          tipo_tolerancia?: string
          tolerancia_inferior?: number | null
          tolerancia_superior?: number | null
          unidad?: string | null
          valor_nominal?: number | null
          zona_tolerancia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "especificaciones_gdt_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          fecha: string
          id: string
          monto: number
          orden_ref: string | null
          proveedor: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion: string
          fecha?: string
          id?: string
          monto?: number
          orden_ref?: string | null
          proveedor?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          monto?: number
          orden_ref?: string | null
          proveedor?: string | null
        }
        Relationships: []
      }
      inspecciones_calidad: {
        Row: {
          archivos: string[] | null
          caracteristicas: Json | null
          created_at: string
          disposicion: string | null
          fecha: string
          id: string
          instrumento_medicion: string | null
          lote: string | null
          maquina: string | null
          notas: string | null
          numero_certificado: string | null
          numero_plano: string | null
          operador: string | null
          orden_id: string | null
          piezas_fabricadas: number
          piezas_scrap: number
          producto: string | null
          revision_plano: string | null
          status: string
          tipo: string
          tolerancias: Json | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          archivos?: string[] | null
          caracteristicas?: Json | null
          created_at?: string
          disposicion?: string | null
          fecha?: string
          id?: string
          instrumento_medicion?: string | null
          lote?: string | null
          maquina?: string | null
          notas?: string | null
          numero_certificado?: string | null
          numero_plano?: string | null
          operador?: string | null
          orden_id?: string | null
          piezas_fabricadas?: number
          piezas_scrap?: number
          producto?: string | null
          revision_plano?: string | null
          status?: string
          tipo?: string
          tolerancias?: Json | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          archivos?: string[] | null
          caracteristicas?: Json | null
          created_at?: string
          disposicion?: string | null
          fecha?: string
          id?: string
          instrumento_medicion?: string | null
          lote?: string | null
          maquina?: string | null
          notas?: string | null
          numero_certificado?: string | null
          numero_plano?: string | null
          operador?: string | null
          orden_id?: string | null
          piezas_fabricadas?: number
          piezas_scrap?: number
          producto?: string | null
          revision_plano?: string | null
          status?: string
          tipo?: string
          tolerancias?: Json | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecciones_calidad_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      instrumentos_medicion: {
        Row: {
          codigo: string
          costo: number | null
          created_at: string
          exactitud: string | null
          fecha_compra: string | null
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          notas: string | null
          numero_serie: string | null
          proveedor: string | null
          rango_medicion: string | null
          resolucion: string | null
          status: string
          tipo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          codigo: string
          costo?: number | null
          created_at?: string
          exactitud?: string | null
          fecha_compra?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          notas?: string | null
          numero_serie?: string | null
          proveedor?: string | null
          rango_medicion?: string | null
          resolucion?: string | null
          status?: string
          tipo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          costo?: number | null
          created_at?: string
          exactitud?: string | null
          fecha_compra?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          notas?: string | null
          numero_serie?: string | null
          proveedor?: string | null
          rango_medicion?: string | null
          resolucion?: string | null
          status?: string
          tipo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventario: {
        Row: {
          categoria: string | null
          categoria_material: string | null
          certificado_material: string | null
          codigo: string
          costo_unitario: number
          created_at: string
          es_fabricable: boolean
          especificacion: string | null
          fecha_ultima_entrada: string | null
          fecha_ultima_salida: string | null
          id: string
          lead_time_dias: number | null
          lote: string | null
          nombre: string
          proveedor_preferido: string | null
          puede_vender: boolean
          ruta: string
          stock: number
          stock_minimo: number
          tipo: string
          ubicacion: string | null
          unidad: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          categoria_material?: string | null
          certificado_material?: string | null
          codigo: string
          costo_unitario?: number
          created_at?: string
          es_fabricable?: boolean
          especificacion?: string | null
          fecha_ultima_entrada?: string | null
          fecha_ultima_salida?: string | null
          id?: string
          lead_time_dias?: number | null
          lote?: string | null
          nombre: string
          proveedor_preferido?: string | null
          puede_vender?: boolean
          ruta?: string
          stock?: number
          stock_minimo?: number
          tipo?: string
          ubicacion?: string | null
          unidad?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          categoria_material?: string | null
          certificado_material?: string | null
          codigo?: string
          costo_unitario?: number
          created_at?: string
          es_fabricable?: boolean
          especificacion?: string | null
          fecha_ultima_entrada?: string | null
          fecha_ultima_salida?: string | null
          id?: string
          lead_time_dias?: number | null
          lote?: string | null
          nombre?: string
          proveedor_preferido?: string | null
          puede_vender?: boolean
          ruta?: string
          stock?: number
          stock_minimo?: number
          tipo?: string
          ubicacion?: string | null
          unidad?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventario_bom: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          material_id: string
          notas: string | null
          producto_id: string
          unidad: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          material_id: string
          notas?: string | null
          producto_id: string
          unidad?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          material_id?: string
          notas?: string | null
          producto_id?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_bom_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_bom_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimiento: {
        Row: {
          costo: number
          created_at: string
          descripcion: string
          fecha: string
          frecuencia: string | null
          id: string
          maquina_id: string
          notas: string | null
          proxima_fecha: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          costo?: number
          created_at?: string
          descripcion: string
          fecha?: string
          frecuencia?: string | null
          id?: string
          maquina_id: string
          notas?: string | null
          proxima_fecha?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          costo?: number
          created_at?: string
          descripcion?: string
          fecha?: string
          frecuencia?: string | null
          id?: string
          maquina_id?: string
          notas?: string | null
          proxima_fecha?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mantenimiento_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinas: {
        Row: {
          anio: number | null
          control: string | null
          costo_hora: number | null
          created_at: string
          fecha_compra: string | null
          horas_trabajadas: number
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          notas: string | null
          numero_ejes: number | null
          numero_serie: string | null
          oee_calidad: number
          oee_disponibilidad: number
          oee_rendimiento: number
          potencia_hp: number | null
          precision_mm: number | null
          recorrido_x: number | null
          recorrido_y: number | null
          recorrido_z: number | null
          rpm_max: number | null
          status: string
          tipo: string
          ubicacion: string | null
          ultimo_mantenimiento: string | null
          updated_at: string
        }
        Insert: {
          anio?: number | null
          control?: string | null
          costo_hora?: number | null
          created_at?: string
          fecha_compra?: string | null
          horas_trabajadas?: number
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          notas?: string | null
          numero_ejes?: number | null
          numero_serie?: string | null
          oee_calidad?: number
          oee_disponibilidad?: number
          oee_rendimiento?: number
          potencia_hp?: number | null
          precision_mm?: number | null
          recorrido_x?: number | null
          recorrido_y?: number | null
          recorrido_z?: number | null
          rpm_max?: number | null
          status?: string
          tipo?: string
          ubicacion?: string | null
          ultimo_mantenimiento?: string | null
          updated_at?: string
        }
        Update: {
          anio?: number | null
          control?: string | null
          costo_hora?: number | null
          created_at?: string
          fecha_compra?: string | null
          horas_trabajadas?: number
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          notas?: string | null
          numero_ejes?: number | null
          numero_serie?: string | null
          oee_calidad?: number
          oee_disponibilidad?: number
          oee_rendimiento?: number
          potencia_hp?: number | null
          precision_mm?: number | null
          recorrido_x?: number | null
          recorrido_y?: number | null
          recorrido_z?: number | null
          rpm_max?: number | null
          status?: string
          tipo?: string
          ubicacion?: string | null
          ultimo_mantenimiento?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ordenes_compra: {
        Row: {
          bom_id: string | null
          created_at: string
          fecha: string
          folio: string
          id: string
          notas: string | null
          proveedor_id: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          bom_id?: string | null
          created_at?: string
          fecha?: string
          folio?: string
          id?: string
          notas?: string | null
          proveedor_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          bom_id?: string | null
          created_at?: string
          fecha?: string
          folio?: string
          id?: string
          notas?: string | null
          proveedor_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra_items: {
        Row: {
          cantidad: number
          cantidad_recibida: number
          created_at: string
          id: string
          material: string
          orden_compra_id: string
          precio_unitario: number
          subtotal: number
          unidad: string
        }
        Insert: {
          cantidad?: number
          cantidad_recibida?: number
          created_at?: string
          id?: string
          material: string
          orden_compra_id: string
          precio_unitario?: number
          subtotal?: number
          unidad?: string
        }
        Update: {
          cantidad?: number
          cantidad_recibida?: number
          created_at?: string
          id?: string
          material?: string
          orden_compra_id?: string
          precio_unitario?: number
          subtotal?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_items_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_produccion: {
        Row: {
          acabado_superficial: string | null
          cantidad_producida: number
          cantidad_requerida: number
          cantidad_scrap: number
          cliente_id: string | null
          costo_estimado: number | null
          costo_real: number | null
          cotizacion_id: string | null
          created_at: string
          fecha_entrega: string | null
          fecha_inicio: string | null
          folio: string
          id: string
          lote: string | null
          material: string | null
          material_grado: string | null
          notas: string | null
          numero_plano: string | null
          numero_serie_inicio: string | null
          peso_unitario: number | null
          prioridad: string | null
          producto: string
          requiere_certificado: boolean | null
          revision_plano: string | null
          status: string
          tiempo_estimado_total_hrs: number | null
          tratamiento_termico: string | null
          updated_at: string
        }
        Insert: {
          acabado_superficial?: string | null
          cantidad_producida?: number
          cantidad_requerida?: number
          cantidad_scrap?: number
          cliente_id?: string | null
          costo_estimado?: number | null
          costo_real?: number | null
          cotizacion_id?: string | null
          created_at?: string
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          folio?: string
          id?: string
          lote?: string | null
          material?: string | null
          material_grado?: string | null
          notas?: string | null
          numero_plano?: string | null
          numero_serie_inicio?: string | null
          peso_unitario?: number | null
          prioridad?: string | null
          producto: string
          requiere_certificado?: boolean | null
          revision_plano?: string | null
          status?: string
          tiempo_estimado_total_hrs?: number | null
          tratamiento_termico?: string | null
          updated_at?: string
        }
        Update: {
          acabado_superficial?: string | null
          cantidad_producida?: number
          cantidad_requerida?: number
          cantidad_scrap?: number
          cliente_id?: string | null
          costo_estimado?: number | null
          costo_real?: number | null
          cotizacion_id?: string | null
          created_at?: string
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          folio?: string
          id?: string
          lote?: string | null
          material?: string | null
          material_grado?: string | null
          notas?: string | null
          numero_plano?: string | null
          numero_serie_inicio?: string | null
          peso_unitario?: number | null
          prioridad?: string | null
          producto?: string
          requiere_certificado?: boolean | null
          revision_plano?: string | null
          status?: string
          tiempo_estimado_total_hrs?: number | null
          tratamiento_termico?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_produccion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      procesos_produccion: {
        Row: {
          avance: number | null
          cantidad_producida: number | null
          cantidad_requerida: number | null
          created_at: string
          descripcion_produccion: string | null
          fixture: string | null
          herramienta: string | null
          id: string
          maquina_id: string | null
          nombre: string
          notas: string | null
          orden_id: string
          orden_secuencia: number
          profundidad_corte: number | null
          programa_cnc: string | null
          refrigerante: string | null
          rpm: number | null
          status: string
          tiempo_estimado_hrs: number
          tipo: string
          updated_at: string
          velocidad_corte: number | null
        }
        Insert: {
          avance?: number | null
          cantidad_producida?: number | null
          cantidad_requerida?: number | null
          created_at?: string
          descripcion_produccion?: string | null
          fixture?: string | null
          herramienta?: string | null
          id?: string
          maquina_id?: string | null
          nombre: string
          notas?: string | null
          orden_id: string
          orden_secuencia?: number
          profundidad_corte?: number | null
          programa_cnc?: string | null
          refrigerante?: string | null
          rpm?: number | null
          status?: string
          tiempo_estimado_hrs?: number
          tipo?: string
          updated_at?: string
          velocidad_corte?: number | null
        }
        Update: {
          avance?: number | null
          cantidad_producida?: number | null
          cantidad_requerida?: number | null
          created_at?: string
          descripcion_produccion?: string | null
          fixture?: string | null
          herramienta?: string | null
          id?: string
          maquina_id?: string | null
          nombre?: string
          notas?: string | null
          orden_id?: string
          orden_secuencia?: number
          profundidad_corte?: number | null
          programa_cnc?: string | null
          refrigerante?: string | null
          rpm?: number | null
          status?: string
          tiempo_estimado_hrs?: number
          tipo?: string
          updated_at?: string
          velocidad_corte?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "procesos_produccion_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesos_produccion_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_procesos: {
        Row: {
          created_at: string
          fixture: string | null
          herramienta: string | null
          id: string
          maquina_id: string | null
          nombre: string
          notas: string | null
          orden_secuencia: number
          producto_id: string
          profundidad_corte: number | null
          programa_cnc: string | null
          refrigerante: string | null
          rpm: number | null
          tiempo_estimado_hrs: number
          tipo: string
          velocidad_corte: number | null
        }
        Insert: {
          created_at?: string
          fixture?: string | null
          herramienta?: string | null
          id?: string
          maquina_id?: string | null
          nombre: string
          notas?: string | null
          orden_secuencia?: number
          producto_id: string
          profundidad_corte?: number | null
          programa_cnc?: string | null
          refrigerante?: string | null
          rpm?: number | null
          tiempo_estimado_hrs?: number
          tipo?: string
          velocidad_corte?: number | null
        }
        Update: {
          created_at?: string
          fixture?: string | null
          herramienta?: string | null
          id?: string
          maquina_id?: string | null
          nombre?: string
          notas?: string | null
          orden_secuencia?: number
          producto_id?: string
          profundidad_corte?: number | null
          programa_cnc?: string | null
          refrigerante?: string | null
          rpm?: number | null
          tiempo_estimado_hrs?: number
          tipo?: string
          velocidad_corte?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "producto_procesos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_procesos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registros_produccion: {
        Row: {
          created_at: string
          fecha: string
          herramienta: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          maquina_id: string | null
          motivo_paro: string | null
          notas: string | null
          operador_nombre: string
          orden_id: string | null
          piezas_producidas: number
          piezas_scrap: number
          proceso_id: string | null
          programa_cnc: string | null
          status: string
          tiempo_paro_min: number | null
          tiempo_setup_min: number | null
          turno: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          herramienta?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          maquina_id?: string | null
          motivo_paro?: string | null
          notas?: string | null
          operador_nombre: string
          orden_id?: string | null
          piezas_producidas?: number
          piezas_scrap?: number
          proceso_id?: string | null
          programa_cnc?: string | null
          status?: string
          tiempo_paro_min?: number | null
          tiempo_setup_min?: number | null
          turno?: string
        }
        Update: {
          created_at?: string
          fecha?: string
          herramienta?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          maquina_id?: string | null
          motivo_paro?: string | null
          notas?: string | null
          operador_nombre?: string
          orden_id?: string | null
          piezas_producidas?: number
          piezas_scrap?: number
          proceso_id?: string | null
          programa_cnc?: string | null
          status?: string
          tiempo_paro_min?: number | null
          tiempo_setup_min?: number | null
          turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_produccion_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_produccion_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_produccion_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_dimensionales: {
        Row: {
          aprobado_por: string | null
          archivos: string[] | null
          created_at: string
          fecha: string
          id: string
          inspeccion_id: string | null
          instrumento_id: string | null
          lote: string | null
          mediciones: Json | null
          notas: string | null
          numero_plano: string | null
          operador: string | null
          orden_id: string | null
          pieza_numero: number | null
          producto: string | null
          resultado_general: string
          revision_plano: string | null
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          archivos?: string[] | null
          created_at?: string
          fecha?: string
          id?: string
          inspeccion_id?: string | null
          instrumento_id?: string | null
          lote?: string | null
          mediciones?: Json | null
          notas?: string | null
          numero_plano?: string | null
          operador?: string | null
          orden_id?: string | null
          pieza_numero?: number | null
          producto?: string | null
          resultado_general?: string
          revision_plano?: string | null
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          archivos?: string[] | null
          created_at?: string
          fecha?: string
          id?: string
          inspeccion_id?: string | null
          instrumento_id?: string | null
          lote?: string | null
          mediciones?: Json | null
          notas?: string | null
          numero_plano?: string | null
          operador?: string | null
          orden_id?: string | null
          pieza_numero?: number | null
          producto?: string | null
          resultado_general?: string
          revision_plano?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_dimensionales_inspeccion_id_fkey"
            columns: ["inspeccion_id"]
            isOneToOne: false
            referencedRelation: "inspecciones_calidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_dimensionales_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "instrumentos_medicion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_dimensionales_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_abonos: {
        Row: {
          created_at: string
          fecha: string
          id: string
          monto: number
          notas: string | null
          prestamo_id: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          prestamo_id: string
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          prestamo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_abonos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "rh_prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_descuentos: {
        Row: {
          created_at: string
          descripcion: string | null
          empleado_id: string
          fecha: string
          id: string
          monto: number
          notas: string | null
          tipo_descuento_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empleado_id: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          tipo_descuento_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empleado_id?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          tipo_descuento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_descuentos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_descuentos_tipo_descuento_id_fkey"
            columns: ["tipo_descuento_id"]
            isOneToOne: false
            referencedRelation: "rh_tipos_descuento"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_faltas: {
        Row: {
          created_at: string
          empleado_id: string
          fecha: string
          id: string
          motivo: string | null
          notas: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          fecha?: string
          id?: string
          motivo?: string | null
          notas?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          fecha?: string
          id?: string
          motivo?: string | null
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_faltas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_incapacidades: {
        Row: {
          created_at: string
          dias: number
          empleado_id: string
          fecha_fin: string | null
          fecha_inicio: string
          folio_imss: string | null
          id: string
          notas: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          dias?: number
          empleado_id: string
          fecha_fin?: string | null
          fecha_inicio?: string
          folio_imss?: string | null
          id?: string
          notas?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          dias?: number
          empleado_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          folio_imss?: string | null
          id?: string
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_incapacidades_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_pagos_empleados: {
        Row: {
          created_at: string
          descuentos: number
          empleado_id: string
          fecha: string
          id: string
          notas: string | null
          periodo: string
          prestamos_descuento: number
          salario_base: number
          tiempo_extra: number
          total: number
        }
        Insert: {
          created_at?: string
          descuentos?: number
          empleado_id: string
          fecha?: string
          id?: string
          notas?: string | null
          periodo?: string
          prestamos_descuento?: number
          salario_base?: number
          tiempo_extra?: number
          total?: number
        }
        Update: {
          created_at?: string
          descuentos?: number
          empleado_id?: string
          fecha?: string
          id?: string
          notas?: string | null
          periodo?: string
          prestamos_descuento?: number
          salario_base?: number
          tiempo_extra?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "rh_pagos_empleados_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_prestamos: {
        Row: {
          abono_quincenal: number
          created_at: string
          empleado_id: string
          fecha: string
          id: string
          monto: number
          notas: string | null
          plazo_quincenas: number
          saldo: number
          status: string
          tipo_prestamo_id: string | null
        }
        Insert: {
          abono_quincenal?: number
          created_at?: string
          empleado_id: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          plazo_quincenas?: number
          saldo?: number
          status?: string
          tipo_prestamo_id?: string | null
        }
        Update: {
          abono_quincenal?: number
          created_at?: string
          empleado_id?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          plazo_quincenas?: number
          saldo?: number
          status?: string
          tipo_prestamo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_prestamos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_prestamos_tipo_prestamo_id_fkey"
            columns: ["tipo_prestamo_id"]
            isOneToOne: false
            referencedRelation: "rh_tipos_prestamo"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_tiempo_extra: {
        Row: {
          autorizado_por: string | null
          created_at: string
          empleado_id: string
          fecha: string
          horas: number
          id: string
          monto: number
          notas: string | null
          tipo: string
        }
        Insert: {
          autorizado_por?: string | null
          created_at?: string
          empleado_id: string
          fecha?: string
          horas?: number
          id?: string
          monto?: number
          notas?: string | null
          tipo?: string
        }
        Update: {
          autorizado_por?: string | null
          created_at?: string
          empleado_id?: string
          fecha?: string
          horas?: number
          id?: string
          monto?: number
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_tiempo_extra_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_tipos_descuento: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          porcentaje_default: number | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          porcentaje_default?: number | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          porcentaje_default?: number | null
        }
        Relationships: []
      }
      rh_tipos_prestamo: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          plazo_max_quincenas: number | null
          tasa_interes: number | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          plazo_max_quincenas?: number | null
          tasa_interes?: number | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          plazo_max_quincenas?: number | null
          tasa_interes?: number | null
        }
        Relationships: []
      }
      rh_vacaciones: {
        Row: {
          aprobado_por: string | null
          created_at: string
          dias: number
          empleado_id: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          notas: string | null
          status: string
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          dias?: number
          empleado_id: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          notas?: string | null
          status?: string
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          dias?: number
          empleado_id?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          notas?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_vacaciones_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
