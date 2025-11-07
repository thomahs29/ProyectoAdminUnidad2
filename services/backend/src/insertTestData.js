const { query } = require('./config/db');

const insertTestData = async () => {
    try {
        console.log('Insertando datos de prueba...');
        
        const testData = [
            {
                rut: '11.111.111-1',
                nombre: 'Test Usuario',
                licencia_numero: 'LIC-2025-001',
                licencia_fecha_vencimiento: '2025-12-31',
                licencia_estado: 'al_día',
                patente_numero: 'PATEN-001',
                patente_estado: 'al_día',
                permiso_estado: 'con_deuda',
                juzgado_estado: 'al_día',
                aseo_estado: 'con_deuda'
            },
            {
                rut: '22.222.222-2',
                nombre: 'Usuario Dos',
                licencia_numero: 'LIC-2025-002',
                licencia_fecha_vencimiento: '2025-06-15',
                licencia_estado: 'con_deuda',
                patente_numero: 'PATEN-002',
                patente_estado: 'con_deuda',
                permiso_estado: 'al_día',
                juzgado_estado: 'con_deuda',
                aseo_estado: 'al_día'
            },
            {
                rut: '33.333.333-3',
                nombre: 'Usuario Tres',
                licencia_numero: 'LIC-2025-003',
                licencia_fecha_vencimiento: '2026-03-20',
                licencia_estado: 'al_día',
                patente_numero: 'PATEN-003',
                patente_estado: 'al_día',
                permiso_estado: 'al_día',
                juzgado_estado: 'al_día',
                aseo_estado: 'al_día'
            }
        ];

        for (const data of testData) {
            const result = await query(
                `INSERT INTO datos_municipales (rut, nombre, licencia_numero, licencia_fecha_vencimiento, licencia_estado, patente_numero, patente_estado, permiso_estado, juzgado_estado, aseo_estado)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (rut) DO UPDATE SET
                 nombre = $2, licencia_numero = $3, licencia_fecha_vencimiento = $4, licencia_estado = $5,
                 patente_numero = $6, patente_estado = $7, permiso_estado = $8, juzgado_estado = $9, aseo_estado = $10`,
                [data.rut, data.nombre, data.licencia_numero, data.licencia_fecha_vencimiento, data.licencia_estado, 
                 data.patente_numero, data.patente_estado, data.permiso_estado, data.juzgado_estado, data.aseo_estado]
            );
            console.log(`✓ Insertado: ${data.rut}`);
        }

        console.log('Datos de prueba insertados exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error insertando datos:', error);
        process.exit(1);
    }
};

insertTestData();
