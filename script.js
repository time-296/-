(function () {
    'use strict';

    // DOM 元素引用
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const prioritySelect = document.getElementById('priority-select');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const stats = document.getElementById('stats');
    const totalCount = document.getElementById('total-count');
    const activeCount = document.getElementById('active-count');
    const completedCount = document.getElementById('completed-count');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');

    // ========== 主题管理 ==========
    const THEME_KEY = 'todo-theme';

    function getSavedTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        return (saved === 'light' || saved === 'dark') ? saved : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        updateThemeIcon(theme);
    }

    function updateThemeIcon(theme) {
        const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        themeIcon.innerHTML = isDark ? `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        ` : `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
        if (theme === 'auto') {
            themeToggle.title = '主题：跟随系统（点击切换浅色/深色，右键恢复跟随系统）';
        } else {
            themeToggle.title = `主题：${theme === 'dark' ? '深色' : '浅色'}（点击切换，右键恢复跟随系统）`;
        }
    }

    function toggleTheme() {
        const current = getSavedTheme();
        let next;
        if (current === 'auto') {
            next = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
        } else if (current === 'light') {
            next = 'dark';
        } else {
            next = 'light';
        }
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    function resetTheme() {
        localStorage.setItem(THEME_KEY, 'auto');
        applyTheme('auto');
    }

    applyTheme(getSavedTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getSavedTheme() === 'auto') {
            updateThemeIcon('auto');
        }
    });

    themeToggle.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
    themeToggle.addEventListener('contextmenu', (e) => { e.preventDefault(); resetTheme(); });

    let longPressTimer;
    themeToggle.addEventListener('mousedown', () => {
        longPressTimer = setTimeout(() => { resetTheme(); }, 600);
    });
    themeToggle.addEventListener('mouseup', () => { clearTimeout(longPressTimer); });
    themeToggle.addEventListener('mouseleave', () => { clearTimeout(longPressTimer); });
    themeToggle.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => { resetTheme(); }, 600);
    });
    themeToggle.addEventListener('touchend', (e) => { e.preventDefault(); clearTimeout(longPressTimer); });
    themeToggle.addEventListener('touchmove', () => { clearTimeout(longPressTimer); });

    // ========== 确认弹窗 ==========
    const confirmModal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    let modalResolve = null;

    function showConfirm(title, desc) {
        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        confirmModal.classList.add('visible');
        return new Promise(resolve => { modalResolve = resolve; });
    }

    function hideConfirm(result) {
        confirmModal.classList.remove('visible');
        if (modalResolve) { modalResolve(result); modalResolve = null; }
    }

    modalConfirm.addEventListener('click', () => hideConfirm(true));
    modalCancel.addEventListener('click', () => hideConfirm(false));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) hideConfirm(false); });

    // ========== 数据管理 ==========
    function loadTodos() {
        try {
            return JSON.parse(localStorage.getItem('todos')) || [];
        } catch {
            return [];
        }
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    let todos = loadTodos();
    let currentFilter = 'all';
    let idCounter = 0;

    function newId() {
        let id = Date.now() + '-' + (idCounter++);
        while (todos.some(t => t.id === id)) {
            id = Date.now() + '-' + (idCounter++);
        }
        return id;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 渲染 ==========
    function renderTodos() {
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        if (todos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>暂无任务</h3>
                    <p>添加您的第一个任务开始吧</p>
                </div>
            `;
            stats.style.display = 'none';
            clearCompletedBtn.style.display = 'none';
            clearAllBtn.style.display = 'none';
            return;
        }

        stats.style.display = 'flex';
        updateStats();

        const completedCount = todos.filter(t => t.completed).length;
        clearCompletedBtn.style.display = completedCount > 0 ? 'inline-block' : 'none';
        clearAllBtn.style.display = 'inline-block';

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 15s1.5-2 4-2 4 2 4 2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="9" cy="9" r="1" fill="currentColor"/>
                        <circle cx="15" cy="9" r="1" fill="currentColor"/>
                    </svg>
                    <h3>没有找到任务</h3>
                    <p>没有符合当前筛选条件的任务</p>
                </div>
            `;
            return;
        }

        todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="check-circle ${todo.completed ? 'completed' : ''}"></div>
                <span class="priority-badge priority-${todo.priority || 'medium'}">${todo.priority === 'high' ? '高' : todo.priority === 'low' ? '低' : '中'}</span>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn">×</button>
            </div>
        `).join('');
    }

    // ========== CRUD ==========
    function addTodo() {
        const text = todoInput.value.trim();
        if (!text) return;

        todos.push({ id: newId(), text, completed: false, priority: prioritySelect.value });
        saveTodos();
        todoInput.value = '';
        renderTodos();
    }

    function toggleTodo(id) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos();
        renderTodos();
    }

    async function deleteTodo(id) {
        const ok = await showConfirm('删除任务', '确定要删除这个任务吗？');
        if (!ok) return;
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
    }

    async function clearCompleted() {
        const count = todos.filter(t => t.completed).length;
        if (count === 0) return;
        const ok = await showConfirm('清除已完成', `确定要删除 ${count} 个已完成的任务吗？`);
        if (!ok) return;
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
    }

    async function clearAll() {
        if (todos.length === 0) return;
        const ok = await showConfirm('清除全部待办', `确定要删除全部 ${todos.length} 个待办吗？此操作不可撤销。`);
        if (!ok) return;
        todos = [];
        saveTodos();
        renderTodos();
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        totalCount.textContent = total;
        activeCount.textContent = total - completed;
        completedCount.textContent = completed;
    }

    function cyclePriority(id) {
        const priorityOrder = ['high', 'medium', 'low'];
        todos = todos.map(todo => {
            if (todo.id !== id) return todo;
            const currentIdx = priorityOrder.indexOf(todo.priority || 'medium');
            const nextPriority = priorityOrder[(currentIdx + 1) % priorityOrder.length];
            return { ...todo, priority: nextPriority };
        });
        saveTodos();
        renderTodos();
    }

    // ========== 编辑（双击） ==========
    function startEdit(id, item) {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        const textEl = item.querySelector('.todo-text');
        textEl.contentEditable = 'true';
        textEl.focus();

        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        item.classList.add('editing');

        function finishEdit() {
            textEl.contentEditable = 'false';
            item.classList.remove('editing');
            const newText = textEl.textContent.trim();
            if (newText && newText !== todo.text) {
                todo.text = newText;
                saveTodos();
            }
            renderTodos();
        }

        textEl.addEventListener('blur', finishEdit, { once: true });
        textEl.addEventListener('keydown', function handler(e) {
            if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
            if (e.key === 'Escape') { textEl.textContent = todo.text; textEl.blur(); }
            if (e.key === 'Escape') textEl.removeEventListener('keydown', handler);
        });
    }

    // ========== 事件委托 ==========
    todoList.addEventListener('click', (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        const id = item.dataset.id;
        if (e.target.classList.contains('check-circle')) toggleTodo(id);
        if (e.target.classList.contains('delete-btn')) deleteTodo(id);
        if (e.target.classList.contains('priority-badge')) cyclePriority(id);
    });

    todoList.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        if (e.target.classList.contains('check-circle') || e.target.classList.contains('delete-btn')) return;
        startEdit(item.dataset.id, item);
    });

    // ========== 其他事件 ==========
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // ========== 初始化 ==========
    renderTodos();
})();
