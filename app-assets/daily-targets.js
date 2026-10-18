window.bootDailyTargets = function () {
  'use strict';
  if (window.dailyTargetsBooted || !document.querySelector('#target-form')) return false;
  window.dailyTargetsBooted = true;

    const STORAGE_KEY = 'dailyTargets.v1';
    const THEME_KEY = 'dailyTargets.theme';
    const $ = selector => document.querySelector(selector);
    const pad = value => String(value).padStart(2, '0');
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const dayKey = (date = new Date()) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const makeId = () => window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const isValidTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    let state = { activities: [], logs: {}, fired: {} };
    let lastRenderedDay = dayKey();

    function setNotice(message, isError = false) {
      const notice = $('#notice');
      notice.textContent = message;
      notice.classList.toggle('error', isError);
      notice.hidden = !message;
    }

    const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

    function validState(value) {
      if (!isRecord(value) || !Array.isArray(value.activities) ||
          !isRecord(value.logs) || !isRecord(value.fired)) return false;
      const ids = value.activities.map(activity => activity && activity.id);
      return new Set(ids).size === ids.length && value.activities.every(activity =>
        activity && typeof activity.id === 'string' &&
        typeof activity.name === 'string' &&
        Number.isSafeInteger(activity.goal) && activity.goal > 0 &&
        typeof activity.unit === 'string' &&
        Array.isArray(activity.reminders) &&
        activity.reminders.every(time => typeof time === 'string' && isValidTime(time))
      ) && Object.entries(value.logs).every(([date, day]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) && isRecord(day) &&
        Object.values(day).every(count => Number.isSafeInteger(count) && count >= 0)
      ) && Object.entries(value.fired).every(([key, fired]) =>
        typeof key === 'string' && (fired === true || fired === 1)
      );
    }

    function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!validState(saved)) throw new Error('The saved data has an invalid format.');
        state = saved;
      } catch (error) {
        setNotice(`Could not load saved targets: ${error.message} You can import a backup to restore your data.`, true);
      }
    }

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        setNotice(`Could not save your changes: ${error.message} Check your browser storage settings.`, true);
        return false;
      }
    }

    function countFor(activityId, date = dayKey()) {
      const value = state.logs[date] && state.logs[date][activityId];
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function render() {
      const activities = state.activities;
      const completed = activities.filter(activity => countFor(activity.id) >= activity.goal).length;
      const percent = activities.length ? Math.round(completed / activities.length * 100) : 0;
      const date = new Date();
      $('#today-date').textContent = date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      $('#summary').textContent = activities.length
        ? completed === activities.length
          ? 'All targets complete. Well done!'
          : `${completed} of ${activities.length} ${activities.length === 1 ? 'target' : 'targets'} complete today.`
        : 'Add a target to get started.';
      $('#score-value').textContent = `${percent}%`;
      $('#target-count').textContent = `${activities.length} ${activities.length === 1 ? 'target' : 'targets'}`;

      $('#today-list').innerHTML = activities.map(activity => {
        const count = countFor(activity.id);
        const done = count >= activity.goal;
        const progress = Math.min(100, Math.round(count / activity.goal * 100));
        const reminders = activity.reminders.length
          ? ` - Reminders ${escapeHtml(activity.reminders.join(', '))}`
          : '';
        return `<article class="target${done ? ' complete' : ''}">
          <div class="target-heading">
            <span class="target-name">${escapeHtml(activity.name)}</span>
            <span class="target-count${done ? ' complete-text' : ''}">${count} / ${activity.goal} ${escapeHtml(activity.unit)}</span>
          </div>
          <p class="target-meta">Daily goal${reminders}</p>
          <div class="progress-track" role="progressbar" aria-label="${escapeHtml(activity.name)} progress"
            aria-valuemin="0" aria-valuemax="${activity.goal}" aria-valuenow="${Math.min(count, activity.goal)}">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
          <div class="target-controls">
            <button class="step-button" type="button" data-action="decrement" data-id="${escapeHtml(activity.id)}"
              aria-label="Decrease ${escapeHtml(activity.name)}" ${count === 0 ? 'disabled' : ''}>-</button>
            <button class="step-button add" type="button" data-action="increment" data-id="${escapeHtml(activity.id)}"
              aria-label="Increase ${escapeHtml(activity.name)}">+</button>
            <span class="spacer"></span>
            ${done ? '<span class="muted">Complete</span>' : ''}
          </div>
        </article>`;
      }).join('') || '<div class="empty"><strong>No targets yet</strong>Add your first daily target to begin tracking.</div>';

      const week = [];
      for (let offset = 6; offset >= 0; offset -= 1) {
        const day = new Date();
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() - offset);
        const key = dayKey(day);
        const met = activities.filter(activity => countFor(activity.id, key) >= activity.goal).length;
        const dayPercent = activities.length ? Math.round(met / activities.length * 100) : 0;
        week.push(`<div class="day${offset === 0 ? ' today' : ''}" title="${escapeHtml(day.toLocaleDateString())}: ${dayPercent}% complete">
          <span class="day-name">${escapeHtml(day.toLocaleDateString(undefined, { weekday: 'short' }))}</span>
          <span class="day-value">${dayPercent}%</span>
          <span class="day-date">${day.getDate()}</span>
        </div>`);
      }
      $('#week').innerHTML = week.join('');

      $('#manage-list').innerHTML = activities.map(activity => `
        <div class="manage-item">
          <div class="manage-info">
            <strong>${escapeHtml(activity.name)}</strong>
            <span>${activity.goal} ${escapeHtml(activity.unit)} per day</span>
          </div>
          <div class="manage-actions">
            <button class="button small" type="button" data-action="edit" data-id="${escapeHtml(activity.id)}">Edit</button>
            <button class="button small danger" type="button" data-action="delete" data-id="${escapeHtml(activity.id)}">Delete</button>
          </div>
        </div>`).join('') || '<p class="muted">Targets you create will appear here.</p>';

      const notificationButton = $('#notification-button');
      notificationButton.hidden = !('Notification' in window) || Notification.permission !== 'default';
    }

    function resetForm() {
      $('#target-form').reset();
      $('#target-id').value = '';
      $('#target-goal').value = '8';
      $('#target-unit').value = 'times';
      $('#form-heading').textContent = 'Create a target';
      $('#save-target').textContent = 'Add target';
      $('#cancel-edit').hidden = true;
    }

    function editTarget(id) {
      const activity = state.activities.find(item => item.id === id);
      if (!activity) return;
      $('#target-id').value = activity.id;
      $('#target-name').value = activity.name;
      $('#target-goal').value = activity.goal;
      $('#target-unit').value = activity.unit;
      $('#target-reminders').value = activity.reminders.join(', ');
      $('#form-heading').textContent = 'Edit target';
      $('#save-target').textContent = 'Save changes';
      $('#cancel-edit').hidden = false;
      $('#target-name').focus();
      $('#target-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    $('#target-form').addEventListener('submit', event => {
      event.preventDefault();
      const id = $('#target-id').value;
      const name = $('#target-name').value.trim();
      const goal = Number($('#target-goal').value);
      const unit = $('#target-unit').value.trim() || 'times';
      const rawTimes = $('#target-reminders').value.trim();
      const reminders = rawTimes ? rawTimes.split(',').map(time => time.trim()) : [];
      if (!name || !Number.isSafeInteger(goal) || goal < 1 || goal > 1000000) {
        setNotice('Enter a target name and a whole-number daily goal between 1 and 1,000,000.', true);
        return;
      }
      if (reminders.some(time => !isValidTime(time))) {
        setNotice('Reminder times must use 24-hour HH:MM format, for example 09:00, 15:30.', true);
        return;
      }
      if (new Set(reminders).size !== reminders.length) {
        setNotice('Remove duplicate reminder times before saving.', true);
        return;
      }
      const updated = { id: id || makeId(), name, goal, unit, reminders };
      const existingIndex = state.activities.findIndex(activity => activity.id === id);
      if (existingIndex >= 0) state.activities[existingIndex] = updated;
      else state.activities.push(updated);
      save();
      setNotice('');
      resetForm();
      render();
    });

    $('#cancel-edit').addEventListener('click', resetForm);
    $('#theme-toggle').addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      $('#theme-toggle').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        setNotice(`Could not save your theme preference: ${error.message}`, true);
      }
    });

    try {
      document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || '';
    } catch (error) {
      setNotice(`Could not load your theme preference: ${error.message}`, true);
      document.documentElement.dataset.theme = '';
    }
    if (document.documentElement.dataset.theme === 'dark') {
      $('#theme-toggle').setAttribute('aria-label', 'Switch to light theme');
    }

    document.querySelector('main').addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const { action, id } = button.dataset;
      const activity = state.activities.find(item => item.id === id);
      if (!activity) return;
      if (action === 'increment' || action === 'decrement') {
        const date = dayKey();
        if (!state.logs[date]) state.logs[date] = {};
        state.logs[date][id] = Math.max(0, countFor(id) + (action === 'increment' ? 1 : -1));
        save();
        render();
      } else if (action === 'edit') {
        editTarget(id);
      } else if (action === 'delete' && window.confirm(`Delete "${activity.name}"? Your previous progress for this target will also be removed.`)) {
        state.activities = state.activities.filter(item => item.id !== id);
        Object.values(state.logs).forEach(day => { delete day[id]; });
        state.fired = Object.fromEntries(Object.entries(state.fired).filter(([key]) => !key.includes(`|${id}|`)));
        save();
        setNotice('');
        render();
      }
    });

    $('#notification-button').addEventListener('click', async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') setNotice('Notifications are blocked by your browser. You can allow them in the site settings.');
        render();
      } catch (error) {
        setNotice(`Could not enable notifications: ${error.message}`, true);
      }
    });

    function exportBackup() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-targets-${dayKey()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('Backup exported.');
    }

    $('#export-button').addEventListener('click', exportBackup);
    $('#import-button').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!validState(imported)) throw new Error('This file is not a valid Daily Targets backup.');
        if (!window.confirm('Replace the targets and progress saved in this browser with this backup?')) return;
        state = imported;
        save();
        setNotice('Backup imported successfully.');
        resetForm();
        render();
      } catch (error) {
        setNotice(`Could not import backup: ${error.message}`, true);
      } finally {
        event.target.value = '';
      }
    });

    function checkReminders() {
      const now = new Date();
      const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const today = dayKey(now);
      if (today !== lastRenderedDay) {
        lastRenderedDay = today;
        render();
      }
      state.fired = Object.fromEntries(Object.entries(state.fired).filter(([key]) => key.startsWith(`${today}|`)));
      state.activities.forEach(activity => activity.reminders.forEach(time => {
        const key = `${today}|${activity.id}|${time}`;
        if (time !== currentTime || state.fired[key] || countFor(activity.id) >= activity.goal) return;
        state.fired[key] = true;
        const message = `${activity.name}: ${countFor(activity.id)} of ${activity.goal} ${activity.unit} so far today.`;
        setNotice(`Reminder: ${message}`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Daily Targets', { body: message });
        }
        save();
      }));
    }

    load();
    render();
    checkReminders();
    window.setInterval(checkReminders, 15000);
    return true;
};

if (!window.bootDailyTargets()) {
  const dailyTargetsObserver = new MutationObserver(() => {
    if (window.bootDailyTargets()) dailyTargetsObserver.disconnect();
  });
  dailyTargetsObserver.observe(document.documentElement, { childList: true, subtree: true });
}
