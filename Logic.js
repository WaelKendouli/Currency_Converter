      const API = "https://api.frankfurter.dev/v1";

      const UI = {
        // State areas
        loading: document.getElementById("loading"),
        error: document.getElementById("error"),
        content: document.getElementById("content"),

        // Inputs + selectors
        amount: document.getElementById("amount"),
        from: document.getElementById("from"),
        to: document.getElementById("to"),

        // Buttons
        btnConvert: document.getElementById("btnConvert"),
        btnSwap: document.getElementById("btnSwap"),
        btnUseUSDJOD: document.getElementById("btnUseUSDJOD"),
        btnUseEURUSD: document.getElementById("btnUseEURUSD"),

        // Result display
        result: document.getElementById("result"),
        meta: document.getElementById("meta"),
        ratePill: document.getElementById("ratePill"),
        datePill: document.getElementById("datePill"),

        // History UI
        chart: document.getElementById("chart"),
        historyBody: document.getElementById("historyBody"),
      };

      let controller = null;
      let currencyMap = {};
      function setLoading(isLoading) {
        UI.loading.style.display = isLoading ? "flex" : "none";

        // ✅ Disable buttons while loading to prevent spam clicks
        UI.btnConvert.disabled = isLoading;
        UI.btnSwap.disabled = isLoading;
        UI.btnUseUSDJOD.disabled = isLoading;
        UI.btnUseEURUSD.disabled = isLoading;
      }

      function setError(message) {
        // ✅ If message is empty/null → hide error box
        if (!message) {
          UI.error.style.display = "none";
          UI.error.textContent = "";
          return;
        }

        // ✅ Else show it
        UI.error.style.display = "block";
        UI.error.textContent = message;
      }