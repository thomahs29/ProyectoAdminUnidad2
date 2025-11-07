const {
    obtenerPorRUT,
    crearOActualizar,
} = require('../models/municipalesModel');

/**
 * GET /api/municipales/consultar
 * Buscar datos municipales por RUT
 */
const consultarPorRUT = async (req, res) => {
    try {
        const { rut } = req.query;

        if (!rut) {
            return res.status(400).json({ error: 'RUT es requerido' });
        }

        // Buscar o crear si no existe
        let datos = await obtenerPorRUT(rut);

        if (!datos) {
            // Extraer nombre del RUT si es posible, o usar genérico
            const nombre = `Ciudadano ${rut}`;
            datos = await crearOActualizar(rut, nombre);
        }

        // Formatear respuesta
        const respuesta = {
            rut: datos.rut,
            nombre: datos.nombre,
            licencia: {
                numero: datos.licencia_numero,
                fecha_vencimiento: datos.licencia_fecha_vencimiento,
                estado: datos.licencia_estado,
                dias_para_vencer: calcularDiasParaVencer(datos.licencia_fecha_vencimiento),
            },
            patente: {
                numero: datos.patente_numero,
                estado: datos.patente_estado,
            },
            permiso_circulacion: {
                estado: datos.permiso_estado,
            },
            juzgado: {
                estado: datos.juzgado_estado,
            },
            aseo: {
                estado: datos.aseo_estado,
            },
        };

        res.status(200).json(respuesta);
    } catch (error) {
        console.error('Error en consultarPorRUT:', error.message);
        res.status(500).json({ error: 'Error al consultar datos municipales' });
    }
};

/**
 * POST /api/municipales/generar-datos
 * Generar datos de prueba para un RUT
 */
const generarDatos = async (req, res) => {
    try {
        const { rut, nombre } = req.body;

        if (!rut) {
            return res.status(400).json({ error: 'RUT es requerido' });
        }

        // Crear o actualizar datos
        const datos = await crearOActualizar(rut, nombre || `Ciudadano ${rut}`);

        res.status(200).json({
            mensaje: 'Datos generados exitosamente',
            datos: {
                rut: datos.rut,
                nombre: datos.nombre,
                licencia: {
                    numero: datos.licencia_numero,
                    fecha_vencimiento: datos.licencia_fecha_vencimiento,
                    estado: datos.licencia_estado,
                },
                patente: {
                    numero: datos.patente_numero,
                    estado: datos.patente_estado,
                },
                permiso_circulacion: {
                    estado: datos.permiso_estado,
                },
                juzgado: {
                    estado: datos.juzgado_estado,
                },
                aseo: {
                    estado: datos.aseo_estado,
                },
            },
        });
    } catch (error) {
        console.error('Error en generarDatos:', error.message);
        res.status(500).json({ error: 'Error al generar datos', detalle: error.message });
    }
};

/**
 * Calcular días para vencer desde una fecha
 */
const calcularDiasParaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    
    const diferencia = vencimiento - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return dias;
};

module.exports = {
    consultarPorRUT,
    generarDatos,
    calcularDiasParaVencer,
};
