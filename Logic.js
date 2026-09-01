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

        async function apiFetchJson(url,signal)
        {
            const res = await fetch(url,{signal});
            if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);
            return res.json();
        }

        async function loadCurrencies()
        {
            const data = await apiFetchJson(`${API}/currencies`, controller.signal);
            currencyMap = data;

            const codes = Object.keys(currencyMap).sort();

            UI.from.innerHTML = "";
            UI.to.innerHTML = "";

            for(const code of codes)
            {
                const name = currencyMap[code];
                const opt1 = document.createElement("option");
                opt1.value = code;
                opt1.textContent = `${code} — ${name}`;
                UI.from.appendChild(opt1);

                const opt2 = document.createElement("option");
                opt2.value = code;
                opt2.textContent = `${code} — ${name}`;
                UI.to.appendChild(opt2);
            }
            UI.from.value = "USD";
            UI.to.value = "EUR";
            UI.content.style.display = "grid";
        }