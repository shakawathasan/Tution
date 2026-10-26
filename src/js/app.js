import { apiRequest, setAuthToken } from './api.js';
import { FeesViewController } from './fees.js';
import { AttendanceViewController } from './attendance.js';
import { TestsViewController } from './tests.js';
import { ParentViewController } from './parent.js';
import { OwnerViewController } from './owner.js';
import { AdminViewController } from './admin.js';

class App {
  constructor() {
    this.currentView = 'fees';
    this.currentUser = null;
    this.allUsers = [];
    this.controllers = {};
  }

  async init() {
    await this.loadCurrentUser();
    this.setupNavigation();
    this.setupRoleSwitcher();
    this.setupToastContainer();

    // Instantiate view controllers
    this.controllers.fees = new FeesViewController(this);
    this.controllers.attendance = new AttendanceViewController(this);
    this.controllers.tests = new TestsViewController(this);
    this.controllers.parent = new ParentViewController(this);
    this.controllers.owner = new OwnerViewController(this);
    this.controllers.admin = new AdminViewController(this);

    // Initial view based on hash or role
    const hash = window.location.hash.replace('#', '');
    if (['fees', 'attendance', 'tests', 'parent', 'owner', 'admin'].includes(hash)) {
      this.switchView(hash);
    } else if (this.currentUser?.role === 'parent') {
      this.switchView('parent');
    } else {
      this.switchView('fees');
    }
  }

  async loadCurrentUser() {
    try {
      const res = await apiRequest('/auth/me');
      this.currentUser = res.user;

      const usersRes = await apiRequest('/auth/users');
      this.allUsers = usersRes.users || [];

      this.updateUserUI();
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  }

  updateUserUI() {
    const userRoleEl = document.getElementById('user-role-label');
    const userNameEl = document.getElementById('user-name-label');
    if (userRoleEl && this.currentUser) {
      userRoleEl.textContent = this.currentUser.role.toUpperCase();
    }
    if (userNameEl && this.currentUser) {
      userNameEl.textContent = this.currentUser.name;
    }
  }

  setupNavigation() {
    // Desktop Nav Links
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        this.switchView(view);
      });
    });

    // Mobile Bottom Nav Links
    document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });

    // Mobile Hamburger Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    if (mobileMenuBtn && mobileMenuDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenuDrawer.classList.toggle('hidden');
      });
      mobileMenuDrawer.querySelectorAll('.mobile-drawer-link').forEach((link) => {
        link.addEventListener('click', () => {
          const view = link.dataset.view;
          this.switchView(view);
          mobileMenuDrawer.classList.add('hidden');
        });
      });
    }
  }

  setupRoleSwitcher() {
    const roleSelect = document.getElementById('role-switcher-select');
    if (!roleSelect) return;

    roleSelect.addEventListener('change', async (e) => {
      const selectedUserId = e.target.value;
      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: { userId: selectedUserId },
        });

        setAuthToken(res.token);
        this.currentUser = res.user;
        this.updateUserUI();
        this.showToast(`Switched active profile to ${res.user.name} (${res.user.role})`, 'info');

        // Automatically route to appropriate view
        if (res.user.role === 'parent') {
          this.switchView('parent');
        } else if (res.user.role === 'teacher' && this.currentView === 'owner') {
          this.switchView('attendance');
        } else {
          this.switchView(this.currentView);
        }
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  }

  switchView(viewName) {
    if (!['fees', 'attendance', 'tests', 'parent', 'owner', 'admin'].includes(viewName)) {
      viewName = 'fees';
    }

    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active state in navs
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.dataset.view === viewName) {
        link.className = 'nav-link text-xs font-semibold text-blue-700 border-b-2 border-blue-700 py-3 px-1 whitespace-nowrap';
      } else {
        link.className = 'nav-link text-xs font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent py-3 px-1 whitespace-nowrap transition-colors';
      }
    });

    document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('text-blue-700', 'font-bold');
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove('text-blue-700', 'font-bold');
        btn.classList.add('text-slate-500');
      }
    });

    // Hide all view containers and show target view
    document.querySelectorAll('.app-view').forEach((el) => el.classList.add('hidden'));
    const targetViewEl = document.getElementById(`view-${viewName}`);
    if (targetViewEl) {
      targetViewEl.classList.remove('hidden');
    }

    // Initialize or refresh target controller
    if (this.controllers[viewName]) {
      this.controllers[viewName].init();
    }
  }

  setupToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let bg = 'bg-slate-900 text-white';
    if (type === 'success') bg = 'bg-emerald-700 text-white';
    if (type === 'error') bg = 'bg-red-700 text-white';
    if (type === 'warning') bg = 'bg-amber-600 text-white';

    const toast = document.createElement('div');
    toast.className = `toast px-4 py-3 rounded-lg text-xs font-medium ${bg} flex items-center justify-between gap-3 shadow-lg`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="text-white/70 hover:text-white font-bold leading-none">&times;</button>
    `;

    toast.querySelector('button').onclick = () => toast.remove();

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  showModal({ title, content, actions = [] }) {
    this.closeModal();

    const backdrop = document.createElement('div');
    backdrop.id = 'app-active-modal';
    backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4';

    backdrop.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900">${title}</h3>
          <button id="modal-top-close" class="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none">&times;</button>
        </div>
        <div class="p-6 overflow-y-auto space-y-4">
          ${content}
        </div>
        ${actions.length > 0 ? `
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2" id="modal-actions-container"></div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(backdrop);

    document.getElementById('modal-top-close').onclick = () => this.closeModal();

    if (actions.length > 0) {
      const actionsContainer = document.getElementById('modal-actions-container');
      actions.forEach((act) => {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 text-xs font-medium rounded-lg transition-colors ${act.className || 'bg-slate-200 text-slate-800'}`;
        btn.textContent = act.label;
        btn.onclick = act.onClick;
        actionsContainer.appendChild(btn);
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('app-active-modal');
    if (modal) modal.remove();
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.tuitionApp = app;
  app.init();
});
