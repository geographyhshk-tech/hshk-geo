/**
 * MODULE: ONLINE EXAM & SURVEY CONTROLLER
 * Geography Edu - High School Help Kit
 * Phong thi va Khao sat truc tuyen, co che Kiosk Mode chong gian lan (Anti-Cheat),
 * cham diem tu dong va quan tri de thi, ket qua thi sinh.
 */

const GeoExamsModule = (function () {
  function fillExamCode(code) {
    const input = document.getElementById("input-exam-code");
    if (input) {
      input.value = code;
      input.focus();
      if (typeof showToast === "function") {
        showToast(`Da tu dong dien ma de: ${code}`, "info");
      }
    }
  }

  function renderExamHubQuickChips() {
    const container = document.getElementById("exam-quick-chips-container");
    if (!container || !window.geoDB) return;

    const exams = window.geoDB.getExams ? window.geoDB.getExams() : [];
    if (!exams || exams.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = exams.map(exam => {
      const typeBadge = exam.type === "survey" ? "Khao sat" : "Trac nghiem";
      const badgeBg = exam.type === "survey" ? "rgba(139, 92, 246, 0.12)" : "rgba(13, 148, 136, 0.12)";
      const badgeColor = exam.type === "survey" ? "#7c3aed" : "#0d9488";
      const escape = typeof escapeHtml === "function" ? escapeHtml : (s => s || "");

      return `
        <button type="button" class="exam-chip-btn" onclick="fillExamCode('${exam.code}')" title="Nhan de dien nhanh ma ${exam.code}">
          <span class="exam-chip-code">${exam.code}</span>
          <span class="exam-chip-title">${escape(exam.title)}</span>
          <span class="exam-chip-badge" style="background:${badgeBg}; color:${badgeColor};">${typeBadge}</span>
        </button>
      `;
    }).join("");
  }

  function openCreateExamModal() {
    if (typeof openModal === "function") {
      openModal("modal-create-exam");
    }
  }

  function openExamAdminModal() {
    if (typeof openModal === "function") {
      openModal("modal-exam-admin");
    }
    if (typeof renderAdminExamsTable === "function") renderAdminExamsTable();
    if (typeof renderExamSubmissionsTable === "function") renderExamSubmissionsTable();
  }

  function confirmExitExam() {
    if (confirm("Ban co chac chan muon thoat khoi phong thi khong? Ket qua lam bai chua nop se bi huy bo.")) {
      if (typeof exitKioskExamMode === "function") {
        exitKioskExamMode();
      }
    }
  }

  return {
    fillExamCode,
    renderExamHubQuickChips,
    openCreateExamModal,
    openExamAdminModal,
    confirmExitExam
  };
})();

window.GeoExamsModule = GeoExamsModule;
