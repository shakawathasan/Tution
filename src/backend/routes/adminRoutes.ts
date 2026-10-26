import { Router } from 'express';
import { db } from '../db.ts';

export const adminRouter = Router();

// --- Students CRUD ---
adminRouter.get('/students', (req, res) => {
  const state = db.getState();
  res.json({ students: state.students });
});

adminRouter.post('/students', (req, res) => {
  try {
    const { name, classBatchId, rollNo, parentName, parentPhone, parentEmail, monthlyFee, notes } = req.body;
    const state = db.getState();

    if (!name || !classBatchId || !parentPhone) {
      return res.status(400).json({ error: 'Name, Class Batch, and Parent Phone are required' });
    }

    const batch = state.batches.find((b) => b.id === classBatchId);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const newStudent = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: `BD-STU-${1000 + state.students.length + 1}`,
      name: name.trim(),
      classBatchId: batch.id,
      classBatchName: batch.name,
      rollNo: Number(rollNo) || state.students.filter((s) => s.classBatchId === batch.id).length + 1,
      parentName: parentName || 'Parent',
      parentPhone: parentPhone.trim(),
      parentEmail,
      monthlyFee: Number(monthlyFee) || batch.monthlyFee,
      enrolledDate: new Date().toISOString().slice(0, 10),
      status: 'active' as const,
      notes,
    };

    state.students.unshift(newStudent);
    db.save();

    db.logAudit('Admin', 'Admin', 'CREATE_STUDENT', 'Student', newStudent.id, `Enrolled student ${newStudent.name} (${newStudent.studentId}) in ${batch.name}`);

    res.status(201).json({ success: true, student: newStudent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.patch('/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, classBatchId, rollNo, parentName, parentPhone, parentEmail, monthlyFee, status, notes } = req.body;
    const state = db.getState();

    const student = state.students.find((s) => s.id === id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (name) student.name = name.trim();
    if (classBatchId) {
      const batch = state.batches.find((b) => b.id === classBatchId);
      if (batch) {
        student.classBatchId = batch.id;
        student.classBatchName = batch.name;
      }
    }
    if (rollNo !== undefined) student.rollNo = Number(rollNo);
    if (parentName) student.parentName = parentName.trim();
    if (parentPhone) student.parentPhone = parentPhone.trim();
    if (parentEmail !== undefined) student.parentEmail = parentEmail;
    if (monthlyFee !== undefined) student.monthlyFee = Number(monthlyFee);
    if (status) student.status = status;
    if (notes !== undefined) student.notes = notes;

    db.save();
    db.logAudit('Admin', 'Admin', 'UPDATE_STUDENT', 'Student', student.id, `Updated profile for ${student.name}`);

    res.json({ success: true, student });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const state = db.getState();

    const student = state.students.find((s) => s.id === id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Safe deletion rule: if student has financial records or attendance, archive instead of deleting!
    const hasPayments = state.payments.some((p) => p.studentId === id);
    const hasObligations = state.feeObligations.some((o) => o.studentId === id && o.paidAmount > 0);
    const hasAttendance = state.attendance.some((a) => a.studentId === id);

    if (hasPayments || hasObligations || hasAttendance) {
      student.status = 'archived';
      db.save();
      db.logAudit(
        'Admin',
        'Admin',
        'ARCHIVE_STUDENT',
        'Student',
        student.id,
        `Student ${student.name} was archived rather than deleted to preserve financial audit trail & attendance records.`
      );
      return res.json({
        success: true,
        archived: true,
        message: `Student '${student.name}' has existing financial or attendance records. The record has been safely archived to protect data integrity.`,
      });
    }

    // Pure delete if no historical dependency
    state.students = state.students.filter((s) => s.id !== id);
    db.save();
    db.logAudit('Admin', 'Admin', 'DELETE_STUDENT', 'Student', id, `Deleted student ${student.name}`);

    res.json({ success: true, deleted: true, message: `Student '${student.name}' removed.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Batches & Classes CRUD ---
adminRouter.get('/batches', (req, res) => {
  const state = db.getState();
  res.json({ batches: state.batches.filter((b) => !b.archived) });
});

adminRouter.post('/batches', (req, res) => {
  try {
    const { name, grade, shift, monthlyFee, subjectNames } = req.body;
    const state = db.getState();

    if (!name || !monthlyFee) {
      return res.status(400).json({ error: 'Batch name and monthly fee are required' });
    }

    const newBatch = {
      id: `batch-${Date.now()}`,
      name: name.trim(),
      grade: grade || 'General',
      shift: shift || 'Standard',
      monthlyFee: Number(monthlyFee),
      subjectNames: Array.isArray(subjectNames) ? subjectNames : ['General Science', 'General Mathematics'],
      academicYear: '2026-2027',
    };

    state.batches.push(newBatch);
    db.save();

    db.logAudit('Admin', 'Admin', 'CREATE_BATCH', 'ClassBatch', newBatch.id, `Created batch "${newBatch.name}"`);

    res.status(201).json({ success: true, batch: newBatch });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- WhatsApp Message Templates ---
adminRouter.get('/templates', (req, res) => {
  const state = db.getState();
  res.json({ templates: state.templates });
});

adminRouter.put('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { templateText } = req.body;
    const state = db.getState();

    const tmpl = state.templates.find((t) => t.id === id);
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });

    tmpl.templateText = templateText.trim();
    db.save();

    db.logAudit('Admin', 'Admin', 'UPDATE_TEMPLATE', 'WhatsAppTemplate', tmpl.id, `Updated template: ${tmpl.name}`);

    res.json({ success: true, template: tmpl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Global Settings ---
adminRouter.get('/settings', (req, res) => {
  const state = db.getState();
  res.json({ settings: state.settings });
});

adminRouter.patch('/settings', (req, res) => {
  try {
    const state = db.getState();
    state.settings = { ...state.settings, ...req.body };
    db.save();

    db.logAudit('Admin', 'Admin', 'UPDATE_GLOBAL_SETTINGS', 'Settings', 'global', 'Updated global academy settings');

    res.json({ success: true, settings: state.settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Audit Logs ---
adminRouter.get('/audit-logs', (req, res) => {
  const state = db.getState();
  res.json({ auditLogs: state.auditLogs.slice(0, 100) });
});

// --- Homework CRUD ---
adminRouter.post('/homework', (req, res) => {
  try {
    const { title, classBatchId, subject, description, dueDate, createdBy = 'Teacher' } = req.body;
    const state = db.getState();

    const batch = state.batches.find((b) => b.id === classBatchId);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const newHw = {
      id: `hw-${Date.now()}`,
      title: title.trim(),
      classBatchId,
      classBatchName: batch.name,
      subject: subject || 'General',
      description: description || '',
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      createdBy,
      createdAt: new Date().toISOString(),
    };

    state.homework.unshift(newHw);
    db.save();

    res.status(201).json({ success: true, homework: newHw });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Announcements CRUD ---
adminRouter.post('/announcements', (req, res) => {
  try {
    const { title, content, targetAudience = 'all', isImportant = false } = req.body;
    const state = db.getState();

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      targetAudience: targetAudience as any,
      date: new Date().toISOString().slice(0, 10),
      isImportant: Boolean(isImportant),
      createdBy: 'Administration',
    };

    state.announcements.unshift(newAnn);
    db.save();

    res.status(201).json({ success: true, announcement: newAnn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reset database to initial verified state
adminRouter.post('/reset-database', (req, res) => {
  db.resetToDefault();
  res.json({ success: true, message: 'Database reset to initial verified state with full demo dataset.' });
});
