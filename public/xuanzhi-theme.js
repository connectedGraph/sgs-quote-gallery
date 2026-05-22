/* 统一三国杀台词站的明暗主题与浮动按钮，供 show.html / CRUD.html 共用 */
(function () {
    var STORAGE_KEY = "sgs-quote-theme";

    function readTheme() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            return stored === "dark" ? "dark" : "light";
        } catch (_error) {
            return "light";
        }
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        document.body.dataset.theme = theme;
        document.querySelectorAll("[data-theme-label]").forEach(function (node) {
            node.textContent = theme === "light" ? "夜间" : "日间";
        });
        document.querySelectorAll("[data-theme-glyph]").forEach(function (node) {
            node.textContent = theme === "light" ? "夜" : "晨";
        });
    }

    function setTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (_error) {
            /* ignore */
        }
        applyTheme(theme);
    }

    function toggleTheme() {
        var current = readTheme();
        setTheme(current === "light" ? "dark" : "light");
    }

    // boot before paint to avoid flash
    applyTheme(readTheme());

    function ensureControls() {
        if (document.getElementById("xuanzhi-floating-controls")) return;
        var wrap = document.createElement("div");
        wrap.id = "xuanzhi-floating-controls";
        wrap.className = "floating-controls";

        var themeBtn = document.createElement("button");
        themeBtn.type = "button";
        themeBtn.className = "icon-btn";
        themeBtn.setAttribute("aria-label", "切换主题");
        themeBtn.innerHTML =
            '<span class="glyph" data-theme-glyph>夜</span>' +
            '<span data-theme-label>夜间</span>';
        themeBtn.addEventListener("click", toggleTheme);

        var sakuraBtn = document.createElement("button");
        sakuraBtn.type = "button";
        sakuraBtn.className = "icon-btn";
        sakuraBtn.setAttribute("aria-label", "切换樱花动画");
        sakuraBtn.innerHTML = '<span class="glyph">樱</span><span>樱花</span>';
        sakuraBtn.addEventListener("click", function () {
            if (window.sakuraControl && typeof window.sakuraControl.toggle === "function") {
                window.sakuraControl.toggle();
            }
        });

        wrap.appendChild(themeBtn);
        wrap.appendChild(sakuraBtn);
        document.body.appendChild(wrap);
        applyTheme(readTheme());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureControls);
    } else {
        ensureControls();
    }

    window.xuanzhiTheme = {
        get: readTheme,
        set: setTheme,
        toggle: toggleTheme,
    };
})();
