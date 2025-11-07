const db = require('../config/db');

/**
 * Crear tabla datos_municipales si no existe
 */
const crearTablaMunicipales = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS datos_municipales (
            id SERIAL PRIMARY KEY,
            rut VARCHAR(12) UNIQUE NOT NULL,
            nombre VARCHAR(100),
            
            licencia_numero VARCHAR(50),
            licencia_fecha_vencimiento DATE,
            licencia_estado VARCHAR(50),
            
            patente_numero VARCHAR(50),
            patente_estado VARCHAR(50),
            
            permiso_estado VARCHAR(50),
            
            juzgado_estado VARCHAR(50),
            
            aseo_estado VARCHAR(50),
            
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        await db.query(query);
    } catch (error) {
        console.error('Error creando tabla datos_municipales:', error.message);
    }
};

/**
 * Buscar datos municipales por RUT
 */
const obtenerPorRUT = async (rut) => {
    try {
        const result = await db.query(
            'SELECT * FROM datos_municipales WHERE rut = $1',
            [rut]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Guardar datos municipales
 */
const guardar = async (datos) => {
    const {
        rut,
        nombre,
        licencia_numero,
        licencia_fecha_vencimiento,
        licencia_estado,
        patente_numero,
        patente_estado,
        permiso_estado,
        juzgado_estado,
        aseo_estado,
    } = datos;

    try {
        const query = `
            INSERT INTO datos_municipales (
                rut, nombre, licencia_numero, licencia_fecha_vencimiento, 
                licencia_estado, patente_numero, patente_estado, 
                permiso_estado, juzgado_estado, aseo_estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (rut) DO UPDATE SET
                nombre = $2,
                licencia_numero = $3,
                licencia_fecha_vencimiento = $4,
                licencia_estado = $5,
                patente_numero = $6,
                patente_estado = $7,
                permiso_estado = $8,
                juzgado_estado = $9,
                aseo_estado = $10
            RETURNING *;
        `;

        const result = await db.query(query, [
            rut, nombre, licencia_numero, licencia_fecha_vencimiento,
            licencia_estado, patente_numero, patente_estado,
            permiso_estado, juzgado_estado, aseo_estado
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Error guardando datos municipales:', error.message);
        throw error;
    }
};

/**
 * Generar datos simulados
 */
const generarDatosSimulados = (rut, nombre) => {
    const estados = ['al_dia', 'con_deuda'];
    
    // Generar mezcla aleatoria: algunos al día, otros con deuda
    const seleccionar = () => estados[Math.floor(Math.random() * estados.length)];
    
    // Generar fecha de vencimiento realista (entre 10 y 365 días desde hoy)
    const hoy = new Date();
    const diasAdelante = Math.floor(Math.random() * 355) + 10;
    const fechaVencimiento = new Date(hoy.getTime() + diasAdelante * 24 * 60 * 60 * 1000);
    const fechaFormato = fechaVencimiento.toISOString().split('T')[0];

    return {
        rut,
        nombre,
        licencia_numero: `LIC-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        licencia_fecha_vencimiento: fechaFormato,
        licencia_estado: seleccionar(),
        patente_numero: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 99)}`,
        patente_estado: seleccionar(),
        permiso_estado: seleccionar(),
        juzgado_estado: seleccionar(),
        aseo_estado: seleccionar(),
    };
};

/**
 * Crear o actualizar datos para un RUT
 */
const crearOActualizar = async (rut, nombre) => {
    try {
        // Verificar si ya existe
        let datos = await obtenerPorRUT(rut);
        
        if (!datos) {
            // Generar datos simulados
            const datosNuevos = generarDatosSimulados(rut, nombre);
            datos = await guardar(datosNuevos);
        }
        
        return datos;
    } catch (error) {
        console.error('Error en crearOActualizar:', error.message);
        throw error;
    }
};

/**
 * Inicializar tabla y datos de prueba
 */
const inicializarDatos = async () => {
    await crearTablaMunicipales();
};

module.exports = {
    crearTablaMunicipales,
    obtenerPorRUT,
    guardar,
    generarDatosSimulados,
    crearOActualizar,
    inicializarDatos,
};
