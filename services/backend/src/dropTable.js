const { query } = require('./config/db');

const dropTable = async () => {
    try {
        console.log('Eliminando tabla datos_municipales...');
        await query('DROP TABLE IF EXISTS datos_municipales CASCADE', []);
        console.log('✅ Tabla eliminada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropTable();
