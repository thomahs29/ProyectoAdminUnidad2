const exceljs = require('exceljs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas'); 
const fs = require('fs');


const pool = require('../config/db');

const genReporteReservas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, formato = 'excel' } = req.query;

        const result = await pool.query(
        `SELECT r.id, u.nombre AS usuario, t.nombre AS tramite, r.fecha, r.hora, r.estado
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.id
        JOIN tramites t ON r.tramite_id = t.id
        WHERE r.fecha BETWEEN $1 AND $2
        ORDER BY r.fecha ASC;`,
        [fechaInicio, fechaFin]
        );

        const reservas = result.rows;

        if (formato === 'excel') {
            const workbook = new exceljs.Workbook();
            const sheet = workbook.addWorksheet('Reservas');

            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Usuario', key: 'usuario', width: 30 },
                { header: 'Trámite', key: 'tramite', width: 30 },
                { header: 'Fecha', key: 'fecha', width: 15 },
                { header: 'Hora', key: 'hora', width: 10 },
                { header: 'Estado', key: 'estado', width: 15 },
            ];

            sheet.addRows(reservas);

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=reservas.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } else {
            res.status(400).json({ message: 'Formato no soportado' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const genReporteTramites = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, formato = 'pdf' } = req.query;

        const result = await pool.query(
            `SELECT t.nombre AS tramite, COUNT(r.id)::INT AS total_reservas
            FROM reservas r
            JOIN tramites t ON r.tramite_id = t.id
            WHERE r.fecha BETWEEN $1 AND $2
            GROUP BY t.nombre
            ORDER BY total_reservas DESC;`,
        [fechaInicio, fechaFin]
        );

        //console.log('Query result:', result.rows); // Debugging line

        const datos = result.rows;
        const labels = datos.map(d => d.tramite);
        const values = datos.map(d => Number(d.total_reservas));

        //console.log('Labels:', labels); // Debugging line
        //console.log('Values:', values); // Debugging line

        const width = 800;
        const height = 400;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

        const imageBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: "bar",
            data: {
                labels,
                datasets: [
                {
                    label: "Cantidad de trámites",
                    data: values,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1
                }
                ]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        const doc = new PDFDocument({ margin: 50 });
        const tempPath = `reporte_tramites_${Date.now()}.pdf`;
        const stream = fs.createWriteStream(tempPath);
        doc.pipe(stream);

        doc.fontSize(18).text("Municipalidad de Linares", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(14).text("Reporte de Trámites por Tipo", { align: "center" });
        doc.moveDown(1);
        doc.fontSize(10).text(`Período: ${fechaInicio} a ${fechaFin}`, { align: "center" });
        doc.moveDown(1);

        // Insertar gráfico
        doc.image(imageBuffer, { align: "center", width: 450 });
        doc.moveDown(1);

        // Tabla resumen
        doc.fontSize(12).text("Resumen de trámites:", { underline: true });
        doc.moveDown(0.5);

        datos.forEach(row => {
        doc.text(`${row.tramite.padEnd(35, ".")}  ${row.total_reservas}`, { continued: false });
        });

        doc.end();

        stream.on("finish", () => {
            res.download(tempPath, (err) => {
                if (err) console.error("Error al descargar PDF:", err);
                fs.unlinkSync(tempPath);
            
            });
        });

        res.on("close", () => {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        });
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    genReporteReservas,
    genReporteTramites
};