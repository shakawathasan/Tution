import { apiRequest } from './api.js';

export class AdminViewController {
  constructor(app) {
    this.app = app;
    this.activeTab = 'students';
  }

  async init() {
    this.renderContainer();
    this.bindEvents();
    await this.loadActiveTabContent();
  }

  renderContainer() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Administration Control Panel</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Full CRUD operations across all five sections, bKash verification queue, templates, and audit logs.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-run-qa-suite" class="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Run Automated QA Suite (23 Tests)
            </button>
            <a href="/api/export/project-zip" download="shikho-tuition-bangladesh.zip" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-sm">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download Project ZIP
            </a>
            <button id="btn-reset-demo" class="px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg">
              Reset Demo
            </button>
          </div>
        </div>

        <!-- Admin Navigation Tabs -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold text-slate-600 bg-slate-50">
            <button class="admin-tab py-3 px-4 border-b-2 border-blue-700 text-blue-700 font-bold whitespace-nowrap" data-tab="students">
              Students Roster
            </button>
            <button class="admin-tab py-3 px-4 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap" data-tab="batches">
              Classes & Batches
            </button>
            <button class="admin-tab py-3 px-4 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap" data-tab="bkash-queue">
              bKash Verification Queue
            </button>
            <button class="admin-tab py-3 px-4 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap" data-tab="templates">
              WhatsApp Templates
            </button>
            <button class="admin-tab py-3 px-4 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap" data-tab="settings">
              Tuition Settings & bKash
            </button>
            <button class="admin-tab py-3 px-4 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap" data-tab="audit">
              Audit Logs Trail
            </button>
          </div>

          <!-- Tab Content Panes -->
          <div class="p-4 sm:p-6">
            <div id="admin-pane-students" class="admin-pane space-y-4"></div>
            <div id="admin-pane-batches" class="admin-pane hidden space-y-4"></div>
            <div id="admin-pane-bkash-queue" class="admin-pane hidden space-y-4"></div>
            <div id="admin-pane-templates" class="admin-pane hidden space-y-4"></div>
            <div id="admin-pane-settings" class="admin-pane hidden space-y-4"></div>
            <div id="admin-pane-audit" class="admin-pane hidden space-y-4"></div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    document.querySelectorAll('.admin-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach((t) => {
          t.className = 'admin-tab py-3 px-4 border-b-2 border-transparent text-slate-600 hover:text-slate-900 whitespace-nowrap';
        });
        tab.className = 'admin-tab py-3 px-4 border-b-2 border-blue-700 text-blue-700 font-bold whitespace-nowrap';

        document.querySelectorAll('.admin-pane').forEach((p) => p.classList.add('hidden'));
        document.getElementById(`admin-pane-${this.activeTab}`)?.classList.remove('hidden');

        this.loadActiveTabContent();
      });
    });

    document.getElementById('btn-reset-demo')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset the database to verified initial demo state? All test modifications will be re-seeded.')) {
        await apiRequest('/admin/reset-database', { method: 'POST' });
        this.app.showToast('Database reset to default seed.', 'success');
        location.reload();
      }
    });

    document.getElementById('btn-run-qa-suite')?.addEventListener('click', () => {
      this.runQaSuite();
    });
  }

  async loadActiveTabContent() {
    if (this.activeTab === 'students') await this.loadStudents();
    if (this.activeTab === 'batches') await this.loadBatches();
    if (this.activeTab === 'bkash-queue') await this.loadBkashQueue();
    if (this.activeTab === 'templates') await this.loadTemplates();
    if (this.activeTab === 'settings') await this.loadSettings();
    if (this.activeTab === 'audit') await this.loadAuditLogs();
  }

  // 1. Students Tab
  async loadStudents() {
    const pane = document.getElementById('admin-pane-students');
    if (!pane) return;

    try {
      const res = await apiRequest('/admin/students');
      pane.innerHTML = `
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Enrolled Students Roster (${res.students.length})</h3>
          <button id="btn-add-student" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm">
            + Enroll Student
          </button>
        </div>
        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
              <tr>
                <th class="p-3">ID & Roll</th>
                <th class="p-3">Student Name</th>
                <th class="p-3">Batch</th>
                <th class="p-3">Parent / Contact</th>
                <th class="p-3 text-right">Fee (BDT)</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${res.students.map((s) => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-mono font-medium">${s.studentId} (Roll: ${s.rollNo})</td>
                  <td class="p-3 font-semibold text-slate-900">${s.name}</td>
                  <td class="p-3">${s.classBatchName}</td>
                  <td class="p-3">${s.parentName} · <span class="font-mono text-slate-500">${s.parentPhone}</span></td>
                  <td class="p-3 text-right tabular-nums font-mono">৳${s.monthlyFee}</td>
                  <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                      ${s.status.toUpperCase()}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <button class="btn-edit-student px-2 py-1 text-slate-600 hover:text-blue-700" data-id="${s.id}">Edit</button>
                    <button class="btn-delete-student px-2 py-1 text-red-600 hover:text-red-800" data-id="${s.id}">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('btn-add-student')?.addEventListener('click', () => this.showAddStudentModal());

      pane.querySelectorAll('.btn-edit-student').forEach((btn) => {
        btn.onclick = () => {
          const s = res.students.find((item) => item.id === btn.dataset.id);
          if (s) this.showEditStudentModal(s);
        };
      });

      pane.querySelectorAll('.btn-delete-student').forEach((btn) => {
        btn.onclick = async () => {
          const s = res.students.find((item) => item.id === btn.dataset.id);
          if (!s) return;
          if (confirm(`Are you sure you want to remove student "${s.name}"? If historical fee or attendance records exist, the student will be safely archived to preserve data integrity.`)) {
            try {
              const delRes = await apiRequest(`/admin/students/${s.id}`, { method: 'DELETE' });
              this.app.showToast(delRes.message, 'info');
              this.loadStudents();
            } catch (err) {
              alert(err.message);
            }
          }
        };
      });
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  showAddStudentModal() {
    this.app.showModal({
      title: 'Enroll New Student',
      content: `
        <form id="add-student-form" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Student Full Name *</label>
              <input type="text" id="stu-name" required placeholder="e.g. Mahir Faysal" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Class / Batch *</label>
              <select id="stu-batch" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
                <!-- populated -->
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Roll No (Optional)</label>
              <input type="number" id="stu-roll" placeholder="Auto" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Monthly Tuition Fee (৳) *</label>
              <input type="number" id="stu-fee" value="2500" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Parent / Guardian Name *</label>
              <input type="text" id="stu-parent" required placeholder="Parent Name" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Parent Phone (Bangladesh) *</label>
              <input type="text" id="stu-phone" required placeholder="017XXXXXXXX" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono">
            </div>
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'text-slate-600', onClick: () => this.app.closeModal() },
        {
          label: 'Enroll Student',
          className: 'bg-blue-700 text-white hover:bg-blue-800 font-semibold',
          onClick: async () => {
            const name = document.getElementById('stu-name').value;
            const classBatchId = document.getElementById('stu-batch').value;
            const rollNo = document.getElementById('stu-roll').value;
            const monthlyFee = document.getElementById('stu-fee').value;
            const parentName = document.getElementById('stu-parent').value;
            const parentPhone = document.getElementById('stu-phone').value;

            if (!name || !classBatchId || !parentPhone) {
              alert('Name, batch, and phone are required.');
              return;
            }

            try {
              await apiRequest('/admin/students', {
                method: 'POST',
                body: { name, classBatchId, rollNo, monthlyFee, parentName, parentPhone },
              });
              this.app.closeModal();
              this.app.showToast('Student enrolled successfully!', 'success');
              this.loadStudents();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ],
    });

    apiRequest('/admin/batches').then((res) => {
      const select = document.getElementById('stu-batch');
      if (select && res.batches) {
        select.innerHTML = res.batches.map((b) => `<option value="${b.id}">${b.name}</option>`).join('');
      }
    });
  }

  showEditStudentModal(s) {
    this.app.showModal({
      title: `Edit Student: ${s.name}`,
      content: `
        <form id="edit-student-form" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Student Full Name *</label>
            <input type="text" id="edit-stu-name" value="${s.name}" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Roll Number</label>
              <input type="number" id="edit-stu-roll" value="${s.rollNo}" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Monthly Fee (৳)</label>
              <input type="number" id="edit-stu-fee" value="${s.monthlyFee}" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Parent Name</label>
              <input type="text" id="edit-stu-parent" value="${s.parentName}" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Parent Phone *</label>
              <input type="text" id="edit-stu-phone" value="${s.parentPhone}" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono">
            </div>
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'text-slate-600', onClick: () => this.app.closeModal() },
        {
          label: 'Save Changes',
          className: 'bg-blue-700 text-white hover:bg-blue-800 font-semibold',
          onClick: async () => {
            const name = document.getElementById('edit-stu-name').value;
            const rollNo = document.getElementById('edit-stu-roll').value;
            const monthlyFee = document.getElementById('edit-stu-fee').value;
            const parentName = document.getElementById('edit-stu-parent').value;
            const parentPhone = document.getElementById('edit-stu-phone').value;

            try {
              await apiRequest(`/admin/students/${s.id}`, {
                method: 'PATCH',
                body: { name, rollNo, monthlyFee, parentName, parentPhone },
              });
              this.app.closeModal();
              this.app.showToast('Student profile updated.', 'success');
              this.loadStudents();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ],
    });
  }

  // 2. Batches Tab
  async loadBatches() {
    const pane = document.getElementById('admin-pane-batches');
    if (!pane) return;

    try {
      const res = await apiRequest('/admin/batches');
      pane.innerHTML = `
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Academic Batches & Classes</h3>
          <button id="btn-add-batch" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm">
            + New Batch
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${res.batches.map((b) => `
            <div class="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-bold text-slate-900 text-sm">${b.name}</h4>
                  <p class="text-slate-500">${b.shift}</p>
                </div>
                <span class="font-mono font-bold text-emerald-700">৳${b.monthlyFee} / mo</span>
              </div>
              <div class="text-slate-600">
                <strong>Subjects:</strong> ${b.subjectNames.join(', ')}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('btn-add-batch')?.addEventListener('click', () => {
        this.showAddBatchModal();
      });
    } catch (e) {
      console.error('Failed to load batches:', e);
    }
  }

  showAddBatchModal() {
    this.app.showModal({
      title: 'Create New Academic Batch',
      content: `
        <form id="add-batch-form" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Batch Name *</label>
            <input type="text" id="batch-name" placeholder="e.g. HSC 2nd Year - Science Intensive" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Grade / Level</label>
              <input type="text" id="batch-grade" placeholder="e.g. HSC-2" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Monthly Fee (৳) *</label>
              <input type="number" id="batch-fee" value="2800" required class="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono">
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Shift / Class Timings</label>
            <input type="text" id="batch-shift" placeholder="e.g. Morning (08:00 AM - 10:00 AM)" class="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'text-slate-600', onClick: () => this.app.closeModal() },
        {
          label: 'Create Batch',
          className: 'bg-blue-700 text-white hover:bg-blue-800 font-semibold',
          onClick: async () => {
            const name = document.getElementById('batch-name').value;
            const grade = document.getElementById('batch-grade').value;
            const monthlyFee = Number(document.getElementById('batch-fee').value);
            const shift = document.getElementById('batch-shift').value;

            if (!name || !monthlyFee) {
              alert('Name and fee are required.');
              return;
            }

            try {
              await apiRequest('/admin/batches', {
                method: 'POST',
                body: { name, grade, monthlyFee, shift },
              });
              this.app.closeModal();
              this.app.showToast('New batch created successfully!', 'success');
              this.loadBatches();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ],
    });
  }

  // 3. bKash Submissions Verification Queue
  async loadBkashQueue() {
    const pane = document.getElementById('admin-pane-bkash-queue');
    if (!pane) return;

    try {
      const res = await apiRequest('/bkash/submissions');
      pane.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">bKash Verification Queue</h3>
            <p class="text-xs text-slate-500">Review parent-submitted Transaction IDs against your bKash merchant/personal statement.</p>
          </div>
        </div>
        ${res.submissions.length === 0 ? `
          <div class="p-8 text-center text-slate-400 text-xs">No pending or historical bKash submissions.</div>
        ` : `
          <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            ${res.submissions.map((sub) => `
              <div class="p-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 text-sm">৳${sub.amount}</span>
                    <span class="font-mono text-pink-700 font-bold bg-pink-50 px-2 py-0.5 rounded border border-pink-200">TrxID: ${sub.transactionId}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">
                      ${sub.status.toUpperCase()}
                    </span>
                  </div>
                  <div class="text-slate-600">
                    <strong>Student:</strong> ${sub.studentName} · <strong>Parent:</strong> ${sub.parentName} (${sub.bKashNumber}) · <strong>Month:</strong> ${sub.monthDisplay}
                  </div>
                  <div class="text-[11px] text-slate-400">Date: ${sub.paymentDate} · Submitted: ${new Date(sub.createdAt).toLocaleString()}</div>
                  ${sub.rejectionReason ? `<div class="text-[11px] text-red-600 font-medium">Rejection reason: ${sub.rejectionReason}</div>` : ''}
                </div>
                ${sub.status === 'pending' ? `
                  <div class="flex items-center gap-2">
                    <button class="btn-approve-bkash px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm" data-id="${sub.id}">
                      Approve & Issue Receipt
                    </button>
                    <button class="btn-reject-bkash px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg" data-id="${sub.id}">
                      Reject
                    </button>
                  </div>
                ` : `
                  <div class="text-[11px] text-slate-400 italic">
                    Reviewed by ${sub.reviewedBy || 'Admin'}
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        `}
      `;

      pane.querySelectorAll('.btn-approve-bkash').forEach((btn) => {
        btn.onclick = async () => {
          if (confirm('Approve this bKash payment? This will record the verified payment and issue an official electronic receipt.')) {
            try {
              const r = await apiRequest(`/bkash/submissions/${btn.dataset.id}/approve`, {
                method: 'POST',
                body: { reviewedBy: this.app.currentUser?.name || 'Admin' },
              });
              this.app.showToast(r.message, 'success');
              this.loadBkashQueue();
            } catch (err) {
              alert(err.message);
            }
          }
        };
      });

      pane.querySelectorAll('.btn-reject-bkash').forEach((btn) => {
        btn.onclick = async () => {
          const reason = prompt('Please enter the rejection reason (e.g. Transaction ID not found in bank/bKash SMS):');
          if (reason !== null) {
            try {
              await apiRequest(`/bkash/submissions/${btn.dataset.id}/reject`, {
                method: 'POST',
                body: { reason, reviewedBy: this.app.currentUser?.name || 'Admin' },
              });
              this.app.showToast('Submission rejected with reason.', 'info');
              this.loadBkashQueue();
            } catch (err) {
              alert(err.message);
            }
          }
        };
      });
    } catch (e) {
      console.error('Failed to load bKash queue:', e);
    }
  }

  // 4. Templates Tab
  async loadTemplates() {
    const pane = document.getElementById('admin-pane-templates');
    if (!pane) return;

    try {
      const res = await apiRequest('/admin/templates');
      pane.innerHTML = `
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-slate-900">WhatsApp Notification Templates</h3>
          <p class="text-xs text-slate-500">Edit dynamic templates with variables like {{parent_name}}, {{student_name}}, {{outstanding_amount}}.</p>
        </div>
        <div class="space-y-4">
          ${res.templates.map((t) => `
            <div class="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 text-sm">${t.name}</span>
                <span class="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">${t.type}</span>
              </div>
              <textarea class="template-editor w-full p-2.5 border border-slate-300 rounded-lg text-xs font-sans text-slate-800 focus:ring-2 focus:ring-blue-500" rows="3" data-id="${t.id}">${t.templateText}</textarea>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-[11px] text-slate-400">
                  Variables: ${t.availableVariables.map((v) => `<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-700">${v}</code>`).join(' ')}
                </div>
                <button class="btn-save-template px-3 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-sm" data-id="${t.id}">
                  Save Template
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      pane.querySelectorAll('.btn-save-template').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const textarea = pane.querySelector(`textarea[data-id="${id}"]`);
          try {
            await apiRequest(`/admin/templates/${id}`, {
              method: 'PUT',
              body: { templateText: textarea.value },
            });
            this.app.showToast('WhatsApp template saved!', 'success');
          } catch (err) {
            alert(err.message);
          }
        };
      });
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }

  // 5. Settings Tab
  async loadSettings() {
    const pane = document.getElementById('admin-pane-settings');
    if (!pane) return;

    try {
      const res = await apiRequest('/admin/settings');
      const s = res.settings;

      pane.innerHTML = `
        <form id="global-settings-form" class="space-y-4 max-w-2xl text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Academy Name *</label>
              <input type="text" id="set-name" value="${s.tuitionName}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold">
            </div>
            <div>
              <label class="block font-medium text-slate-700 mb-1">Tagline</label>
              <input type="text" id="set-tagline" value="${s.tagline}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Academy Phone *</label>
              <input type="text" id="set-phone" value="${s.phone}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono">
            </div>
            <div>
              <label class="block font-medium text-slate-700 mb-1">Academy Email</label>
              <input type="email" id="set-email" value="${s.email}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs">
            </div>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">Address (Dhaka / Bangladesh)</label>
            <input type="text" id="set-address" value="${s.address}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs">
          </div>
          <div class="p-4 bg-pink-50 border border-pink-100 rounded-xl space-y-3">
            <h4 class="font-bold text-pink-800 text-sm">bKash Configuration</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-slate-700 mb-1">Tuition bKash Number *</label>
                <input type="text" id="set-bkash-num" value="${s.bkashNumber}" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold">
              </div>
              <div>
                <label class="block font-medium text-slate-700 mb-1">bKash Account Type *</label>
                <select id="set-bkash-type" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold">
                  <option value="Merchant" ${s.bkashAccountType === 'Merchant' ? 'selected' : ''}>Merchant (Make Payment)</option>
                  <option value="Personal" ${s.bkashAccountType === 'Personal' ? 'selected' : ''}>Personal (Send Money)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-medium text-slate-700 mb-1">Parent Payment Instructions</label>
              <textarea id="set-bkash-inst" rows="3" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs">${s.bkashInstructions}</textarea>
            </div>
          </div>
          <button type="submit" class="px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm">
            Save Global Settings
          </button>
        </form>
      `;

      document.getElementById('global-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await apiRequest('/admin/settings', {
            method: 'PATCH',
            body: {
              tuitionName: document.getElementById('set-name').value,
              tagline: document.getElementById('set-tagline').value,
              phone: document.getElementById('set-phone').value,
              email: document.getElementById('set-email').value,
              address: document.getElementById('set-address').value,
              bkashNumber: document.getElementById('set-bkash-num').value,
              bkashAccountType: document.getElementById('set-bkash-type').value,
              bkashInstructions: document.getElementById('set-bkash-inst').value,
            },
          });
          this.app.showToast('Global settings updated!', 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  // 6. Audit Logs Tab
  async loadAuditLogs() {
    const pane = document.getElementById('admin-pane-audit');
    if (!pane) return;

    try {
      const res = await apiRequest('/admin/audit-logs');
      pane.innerHTML = `
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Immutable Audit Trail</h3>
          <span class="text-xs text-slate-400">Latest 100 system events</span>
        </div>
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
              <tr>
                <th class="p-3 w-40">Timestamp</th>
                <th class="p-3 w-32">User</th>
                <th class="p-3 w-40">Action</th>
                <th class="p-3">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${res.auditLogs.map((l) => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-mono text-slate-500 text-[11px]">${new Date(l.timestamp).toLocaleString()}</td>
                  <td class="p-3 font-semibold text-slate-900">${l.userName}</td>
                  <td class="p-3"><code class="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[10px]">${l.action}</code></td>
                  <td class="p-3 text-slate-600">${l.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  }

  // 7. Automated QA Suite Modal (23 criteria tests)
  async runQaSuite() {
    this.app.showModal({
      title: 'Automated QA Test Suite (Prompt Section 16)',
      content: `
        <div id="qa-suite-content" class="p-2 space-y-4 text-xs font-sans">
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div class="font-bold text-slate-900 text-sm">Evaluating 23 Integrity Conditions...</div>
              <div class="text-[11px] text-slate-500">Testing calculations, constraints, permissions, bKash, and WhatsApp.</div>
            </div>
            <div id="qa-spinner" class="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
          <div id="qa-tests-list" class="space-y-2 max-h-[55vh] overflow-y-auto">
            <!-- Test results injected -->
          </div>
        </div>
      `,
      actions: [{ label: 'Close', className: 'text-slate-600', onClick: () => this.app.closeModal() }],
    });

    try {
      const res = await apiRequest('/qa/run-tests');
      const listEl = document.getElementById('qa-tests-list');
      const spinnerEl = document.getElementById('qa-spinner');
      if (spinnerEl) spinnerEl.remove();

      if (listEl) {
        listEl.innerHTML = `
          <div class="p-3 rounded-lg font-bold text-center ${res.allPassed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800'}">
            Score: ${res.passedCount} of ${res.totalTests} Tests Passed (${Math.round((res.passedCount / res.totalTests) * 100)}%)
          </div>
          <div class="space-y-1.5 pt-2">
            ${res.results.map((r) => `
              <div class="p-2.5 rounded border ${r.passed ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'} flex items-start gap-2">
                <span class="${r.passed ? 'text-emerald-600' : 'text-red-600'} font-bold">
                  ${r.passed ? '✓' : '✗'}
                </span>
                <div class="flex-1">
                  <div class="font-semibold text-slate-800">${r.id}. ${r.title}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">${r.details}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (err) {
      alert('QA Test failed to run: ' + err.message);
    }
  }
}
