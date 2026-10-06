import { jsPDF } from 'jspdf';
import { Alumno, Rutina, EvaluacionClinica } from '../types';

export function buildRoutinePDF(alumno: Alumno, rutina: Rutina, evaluacion?: EvaluacionClinica | null): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Dark Banner
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GYMFITPRO MANAGER', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('PRESCRIPCIÓN BIOMECÁNICA & GESTIÓN DE CARGA (Demanda vs. Capacidad)', 14, 18);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 18, { align: 'right' });

  y = 36;

  // Athlete & Routine Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${alumno.nombre} ${alumno.apellido}`, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  let contactLine = `Tel: ${alumno.telefono}${alumno.dni ? ` · DNI: ${alumno.dni}` : ''}`;
  if (alumno.contacto_emergencia_telefono) {
    contactLine += ` · SOS: ${alumno.contacto_emergencia_telefono} (${alumno.contacto_emergencia_nombre || 'Emergencias'})`;
  }
  doc.text(contactLine, 18, y + 13);
  doc.text(`Rutina: ${rutina.nombre_rutina} · Ingreso: ${alumno.fecha_inicio || '2024'}`, 18, y + 19);
  doc.text(`Ciclo: ${rutina.fecha_inicio} al ${rutina.fecha_cambio}`, pageWidth - 18, y + 19, { align: 'right' });

  y += 32;

  // Active Injury Alert
  if (alumno.alerta_lesion_activa || (alumno.dolor_eva_actual && alumno.dolor_eva_actual > 0)) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'FD');

    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`ALERTA CLÍNICA / PRECAUCIÓN BIOMECÁNICA (EVA: ${alumno.dolor_eva_actual || 0}/10)`, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const alertText = doc.splitTextToSize(alumno.alerta_lesion_activa || 'Monitoreo de tolerancia en sala.', pageWidth - 36);
    doc.text(alertText, 18, y + 10);

    y += 18;
  }

  // Routine Blocks & Exercises
  rutina.bloques.forEach((bloque) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(bloque.nombre_sub_pestana.toUpperCase(), 17, y + 5);
    y += 9;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', 16, y + 4.2);
    doc.text('EJERCICIO', 22, y + 4.2);
    doc.text('SERIES', 90, y + 4.2);
    doc.text('REPETICIONES', 106, y + 4.2);
    doc.text('CARGA (KG)', 132, y + 4.2);
    doc.text('PAUSA', 156, y + 4.2);
    doc.text('OBSERVACIONES', 174, y + 4.2);
    y += 7;

    bloque.ejercicios.forEach((ej, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 1, pageWidth - 28, 8, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text(String(ej.orden || idx + 1), 16, y + 4);
      doc.setFont('helvetica', 'bold');
      const exTitle = doc.splitTextToSize(ej.ejercicio, 66);
      doc.text(exTitle[0], 22, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(ej.series || '3', 90, y + 4);
      doc.text(ej.repeticiones || '10', 106, y + 4);
      doc.text(ej.carga || '-', 132, y + 4);
      doc.text(ej.pausa || '60s', 156, y + 4);

      const notes = doc.splitTextToSize(ej.observaciones_dosificacion || '-', 22);
      doc.text(notes[0], 174, y + 4);

      y += 8;
    });

    y += 4;
  });

  if (evaluacion && y < 250) {
    y += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('CRITERIO TERAPÉUTICO & CAPACIDAD BIOPSICOSOCIAL:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Decisión: ${evaluacion.decision_conducta} | Tolerancia: ${evaluacion.tolerancia_carga_estimada} | Estrés: ${evaluacion.nivel_estres}/10 | Sueño: ${evaluacion.calidad_sueno}/5 | Kinesiofobia: ${evaluacion.kinesiofobia_nivel}`,
      14,
      y + 4
    );
  }

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GymFitPro Manager · Documento de Prescripción · Página ${i} de ${totalPages} · Confidencial`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

export function exportRoutineToPDF(alumno: Alumno, rutina: Rutina, evaluacion?: EvaluacionClinica | null) {
  const doc = buildRoutinePDF(alumno, rutina, evaluacion);
  const filename = `Rutina_${alumno.nombre}_${alumno.apellido}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

export function shareRoutineViaWhatsApp(
  alumno: Alumno,
  rutina: Rutina,
  evaluacion?: EvaluacionClinica | null
) {
  // 1. Descarga automática del archivo PDF
  const doc = buildRoutinePDF(alumno, rutina, evaluacion);
  const filename = `Rutina_${alumno.nombre}_${alumno.apellido}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);

  // 2. Mensaje limpio y profesional con los datos del alumno y de la rutina
  let message = `*GYMFITPRO MANAGER - PLAN DE ENTRENAMIENTO*\n`;
  message += `👤 *Alumno:* ${alumno.nombre} ${alumno.apellido}\n`;
  message += `📋 *Rutina:* ${rutina.nombre_rutina}\n`;
  message += `📅 *Vigencia:* ${rutina.fecha_inicio} al ${rutina.fecha_cambio}\n`;

  if (alumno.alerta_lesion_activa) {
    message += `⚠️ *Precaución Biomecánica:* ${alumno.alerta_lesion_activa}\n`;
  }

  if (rutina.notas_generales) {
    message += `💡 *Pauta General:* ${rutina.notas_generales}\n`;
  }

  message += `\n📄 *Rutina en PDF:* Te comparto adjunto el archivo PDF con tu planificación completa, series, repeticiones, cargas y descansos para que puedas consultarla o imprimirla.\n`;
  message += `\n_Emitido con GymFitPro Manager · Control de Demanda vs. Capacidad_`;

  const phone = alumno.telefono ? alumno.telefono.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(message);
  const waUrl = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

  // 3. Redirección DIRECTA al chat de WhatsApp de ese alumno (sin ventanas del sistema)
  const link = document.createElement('a');
  link.href = waUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}