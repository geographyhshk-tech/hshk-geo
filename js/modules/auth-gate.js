/**
 * MODULE: AUTH GATE & ACCESS SECURITY CONTROLLER
 * Geography Edu - High School Help Kit
 * Dieu khien man hinh khoa khach (Auth Gate), Dang nhap, Dang ky, Xac thuc Anti-Bot 3 lua chon,
 * Dong bo giao dien Auth UI va Thanh dieu huong Mobile.
 */

const GeoAuthGateModule = (function () {
  let _pendingRegistrationData = null;
  let _isProcessingRobotVerification = false;

  function switchAuthGateTab(tab) {
    const loginBtn = document.getElementById("auth-gate-tab-login-btn");
    const regBtn = document.getElementById("auth-gate-tab-register-btn");
    const tabNav = document.querySelector(".auth-gate-tab-nav");
    const loginPane = document.getElementById("auth-gate-login-pane");
    const regPane = document.getElementById("auth-gate-register-pane");
    const robotPane = document.getElementById("auth-gate-robot-pane");

    if (loginPane) loginPane.style.display = "none";
    if (regPane) regPane.style.display = "none";
    if (robotPane) robotPane.style.display = "none";

    if (tab === "login") {
      if (tabNav) tabNav.style.display = "grid";
      if (loginBtn) loginBtn.classList.add("active");
      if (regBtn) regBtn.classList.remove("active");
      if (loginPane) {
        loginPane.style.display = "block";
        loginPane.classList.add("active");
      }
    } else if (tab === "register") {
      if (tabNav) tabNav.style.display = "grid";
      if (regBtn) regBtn.classList.add("active");
      if (loginBtn) loginBtn.classList.remove("active");
      if (regPane) {
        regPane.style.display = "block";
        regPane.classList.add("active");
      }
    } else if (tab === "robot") {
      if (tabNav) tabNav.style.display = "none";
      if (robotPane) {
        robotPane.style.display = "block";
        robotPane.classList.add("active");
      }
    }
  }

  function checkAuthGate() {
    const overlay = document.getElementById("auth-gate-overlay");
    if (!overlay) return;

    const isAuth = window.geoAuth && window.geoAuth.isAuthenticated();
    if (isAuth) {
      document.documentElement.classList.remove("geo-guest-locked");
      document.documentElement.classList.add("geo-logged-in");
      overlay.style.display = "none";
      overlay.classList.add("hidden");

      const openModals = document.querySelectorAll(".modal-backdrop.show");
      if (openModals.length === 0) {
        document.body.style.overflow = "";
      }
    } else {
      document.documentElement.classList.remove("geo-logged-in");
      document.documentElement.classList.add("geo-guest-locked");
      overlay.style.display = "flex";
      overlay.classList.remove("hidden");
      if (typeof closeAllModals === "function") closeAllModals();
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const emailInput = document.getElementById("gate-login-email");
        if (emailInput && document.activeElement !== emailInput) {
          emailInput.focus();
        }
      }, 50);
    }
  }

  async function submitAuthGateLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailInput = document.getElementById("gate-login-email");
    const pwdInput = document.getElementById("gate-login-password");
    const submitBtn = document.getElementById("btn-gate-login-submit");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";

    if (!email || !password) {
      showToast("Vui long nhap day du Gmail va Mat khau!", "error");
      return;
    }

    const originalBtnContent = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Dang xac thuc...</span>`;
    }

    try {
      const user = await window.geoAuth.login({ email, password });

      const isMaint = window.geoDB ? window.geoDB.isMaintenanceActive() : false;
      if (isMaint) {
        const userRole = (user.role || "").toLowerCase();
        const userType = user.userType || "";
        const userEmail = (user.email || "").toLowerCase().trim();
        const isUserAdmin = (userRole === "admin" || userType === "Admin" || userEmail === "vut510624@gmail.com" || userEmail === "hshk.project@gmail.com");

        if (!isUserAdmin) {
          await window.geoAuth.logout();
          if (typeof updateMaintenanceUI === "function") updateMaintenanceUI();
          showToast("He thong dang trong Che Do Bao Tri! Chi tai khoan Quan tri vien (Admin) moi co quyen dang nhap.", "error");
          return;
        }
      }

      if (emailInput) emailInput.value = "";
      if (pwdInput) pwdInput.value = "";
      updateAuthUI();
      checkAuthGate();
      showToast(`Dang nhap thanh cong! Chao mung ${user.name} den voi Geography Edu.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    }
  }

  async function submitAuthGateRegister(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById("gate-reg-fullname");
    const emailInput = document.getElementById("gate-reg-email");
    const pwdInput = document.getElementById("gate-reg-password");
    const typeInput = document.getElementById("gate-reg-usertype");

    const fullName = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";
    const userType = typeInput ? typeInput.value : "Hoc sinh THCS";

    if (!fullName || !email || !password) {
      showToast("Vui long dien day du cac thong tin bat buoc!", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showToast("Dia chi Gmail / Email khong hop le!", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Mat khau phai co toi thieu 6 ky tu!", "error");
      return;
    }

    _pendingRegistrationData = { fullName, email, password, userType, source: "gate" };
    window._pendingRegistrationData = _pendingRegistrationData;
    switchAuthGateTab("robot");
  }

  async function submitModalRegister(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById("reg-fullname");
    const emailInput = document.getElementById("reg-email");
    const pwdInput = document.getElementById("reg-password");
    const typeInput = document.getElementById("reg-usertype");

    const fullName = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";
    const userType = typeInput ? typeInput.value : "Hoc sinh THCS";

    if (!fullName || !email || !password) {
      showToast("Vui long dien day du cac thong tin bat buoc!", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showToast("Dia chi Gmail / Email khong hop le!", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Mat khau phai co toi thieu 6 ky tu!", "error");
      return;
    }

    _pendingRegistrationData = { fullName, email, password, userType, source: "modal" };
    window._pendingRegistrationData = _pendingRegistrationData;
    if (typeof closeModal === "function") closeModal("modal-register");
    if (typeof openModal === "function") openModal("modal-robot-verification");
  }

  function cancelGateRobotVerification() {
    _pendingRegistrationData = null;
    window._pendingRegistrationData = null;
    switchAuthGateTab("register");
    showToast("Da quay lai form dang ky tai khoan.", "info");
  }

  function cancelRobotVerification() {
    const isFromModal = window._pendingRegistrationData && window._pendingRegistrationData.source === "modal";
    _pendingRegistrationData = null;
    window._pendingRegistrationData = null;
    if (typeof closeModal === "function") closeModal("modal-robot-verification");
    if (isFromModal) {
      if (typeof openModal === "function") openModal("modal-register");
    } else {
      switchAuthGateTab("register");
    }
    showToast("Da quay lai form dang ky tai khoan.", "info");
  }

  async function handleRobotVerificationChoice(choice) {
    if (_isProcessingRobotVerification) return;

    const pending = window._pendingRegistrationData || _pendingRegistrationData;
    if (!pending) {
      if (typeof closeModal === "function") closeModal("modal-robot-verification");
      switchAuthGateTab("register");
      showToast("Phien dang ky da het han hoac chua co thong tin. Vui long thu lai!", "error");
      return;
    }

    const isFromModal = pending.source === "modal";

    if (choice === "yes" || choice === "definitely_yes") {
      _pendingRegistrationData = null;
      window._pendingRegistrationData = null;
      if (typeof closeModal === "function") closeModal("modal-robot-verification");
      if (isFromModal) {
        if (typeof openModal === "function") openModal("modal-register");
      } else {
        switchAuthGateTab("register");
      }
      showToast("Ban da xac nhan la robot! Yeu cau dang ky tai khoan bi tu choi.", "error");
      return;
    }

    if (choice === "no") {
      _isProcessingRobotVerification = true;

      const allChoiceBtns = document.querySelectorAll(".robot-choice-btn, #btn-robot-answer-yes, #btn-robot-answer-no, #btn-robot-answer-definitely");
      const humanBtns = document.querySelectorAll(".robot-choice-btn.choice-human, #btn-robot-answer-no");
      const originalContents = new Map();

      allChoiceBtns.forEach(btn => {
        btn.disabled = true;
        btn.classList.add("disabled");
        btn.style.pointerEvents = "none";
      });

      humanBtns.forEach(btn => {
        originalContents.set(btn, btn.innerHTML);
        btn.classList.remove("disabled");
        btn.classList.add("btn-loading");
        btn.innerHTML = `
          <span class="robot-spinner" aria-hidden="true"></span>
          <span class="robot-choice-label" style="color: #0d9488;">Dang xac thuc...</span>
          <span class="robot-choice-sub">Khoi tao bao mat PBKDF2...</span>
        `;
      });

      try {
        const user = await window.geoAuth.register(pending);

        const nameInput = document.getElementById("gate-reg-fullname");
        const emailInput = document.getElementById("gate-reg-email");
        const pwdInput = document.getElementById("gate-reg-password");
        if (nameInput) nameInput.value = "";
        if (emailInput) emailInput.value = "";
        if (pwdInput) pwdInput.value = "";

        const regModalName = document.getElementById("reg-fullname");
        const regModalEmail = document.getElementById("reg-email");
        const regModalPwd = document.getElementById("reg-password");
        if (regModalName) regModalName.value = "";
        if (regModalEmail) regModalEmail.value = "";
        if (regModalPwd) regModalPwd.value = "";

        _pendingRegistrationData = null;
        window._pendingRegistrationData = null;
        if (typeof closeModal === "function") {
          closeModal("modal-robot-verification");
          closeModal("modal-register");
        }
        switchAuthGateTab("login");
        updateAuthUI();
        checkAuthGate();
        showToast(`Xac thuc thanh cong! Chao mung ${user.name} den voi Geography Edu.`, "success");
      } catch (err) {
        showToast(err.message, "error");
        if (isFromModal) {
          if (typeof closeModal === "function") closeModal("modal-robot-verification");
          if (typeof openModal === "function") openModal("modal-register");
        } else {
          switchAuthGateTab("register");
        }
      } finally {
        _isProcessingRobotVerification = false;
        allChoiceBtns.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove("disabled", "btn-loading");
          btn.style.pointerEvents = "";
        });
        humanBtns.forEach(btn => {
          if (originalContents.has(btn)) {
            btn.innerHTML = originalContents.get(btn);
          }
        });
      }
    }
  }

  function toggleMobileNav(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const navMenu = document.getElementById("nav-menu");
    const mobileToggle = document.getElementById("mobile-nav-toggle");
    const backdrop = document.getElementById("mobile-nav-backdrop");
    if (!navMenu) return;

    const isOpen = navMenu.classList.toggle("open");
    if (mobileToggle) {
      mobileToggle.classList.toggle("active", isOpen);
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    if (backdrop) {
      backdrop.classList.toggle("show", isOpen);
    }
    document.body.classList.toggle("mobile-nav-open", isOpen);
  }

  function closeMobileNav() {
    const navMenu = document.getElementById("nav-menu");
    const mobileToggle = document.getElementById("mobile-nav-toggle");
    const backdrop = document.getElementById("mobile-nav-backdrop");
    if (navMenu) navMenu.classList.remove("open");
    if (mobileToggle) {
      mobileToggle.classList.remove("active");
      mobileToggle.setAttribute("aria-expanded", "false");
    }
    if (backdrop) {
      backdrop.classList.remove("show");
    }
    document.body.classList.remove("mobile-nav-open");
  }

  function updateAuthUI() {
    const user = window.geoAuth ? window.geoAuth.currentUser : null;
    const guestBox = document.getElementById("auth-guest-box");
    const userBox = document.getElementById("auth-user-box");
    const navAdminTab = document.getElementById("nav-link-admin");
    const mobileGuestActions = document.getElementById("nav-mobile-guest-actions");
    const mobileUserActions = document.getElementById("nav-mobile-user-actions");

    if (user) {
      if (guestBox) guestBox.style.display = "none";
      if (userBox) userBox.style.display = "flex";
      if (mobileGuestActions) mobileGuestActions.style.display = "none";
      if (mobileUserActions) mobileUserActions.style.display = "flex";

      const userNameEl = document.getElementById("auth-user-name");
      const userAvatarEl = document.getElementById("auth-user-avatar");
      const mobUserNameEl = document.getElementById("nav-mobile-user-name");
      const mobUserAvatarEl = document.getElementById("nav-mobile-user-avatar");

      if (userNameEl) userNameEl.textContent = user.name;
      if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
      if (mobUserNameEl) mobUserNameEl.textContent = user.name;
      if (mobUserAvatarEl) mobUserAvatarEl.textContent = user.name.charAt(0).toUpperCase();

      const roleLabel = document.getElementById("auth-user-role");
      const mobRoleLabel = document.getElementById("nav-mobile-user-role");

      if (user.role === "admin") {
        const adminBadge = `<span class="admin-badge-indicator">Admin</span>`;
        if (roleLabel) roleLabel.innerHTML = adminBadge;
        if (mobRoleLabel) mobRoleLabel.innerHTML = adminBadge;
        if (navAdminTab) navAdminTab.style.display = "flex";
      } else {
        const userRoleText = user.userType || "Hoc sinh THCS";
        if (roleLabel) roleLabel.textContent = userRoleText;
        if (mobRoleLabel) mobRoleLabel.textContent = userRoleText;
        if (navAdminTab) navAdminTab.style.display = "none";
      }
    } else {
      if (guestBox) guestBox.style.display = "flex";
      if (userBox) userBox.style.display = "none";
      if (mobileGuestActions) mobileGuestActions.style.display = "flex";
      if (mobileUserActions) mobileUserActions.style.display = "none";
      if (navAdminTab) navAdminTab.style.display = "none";
    }
  }

  return {
    switchAuthGateTab,
    checkAuthGate,
    submitAuthGateLogin,
    submitAuthGateRegister,
    submitModalRegister,
    cancelGateRobotVerification,
    cancelRobotVerification,
    handleRobotVerificationChoice,
    toggleMobileNav,
    closeMobileNav,
    updateAuthUI
  };
})();

window.GeoAuthGateModule = GeoAuthGateModule;
