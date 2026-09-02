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


        async function convertOnce(from , to , amount){
            const url = `${API}/latest?base=${encodeURIComponent(
          from
        )}&symbols=${encodeURIComponent(to)}`;
        const data = await apiFetchJson(url , controller.signal);
        const rate = data.rate?.[to];
                if (!rate) throw new Error(`Rate not found for ${from} → ${to}`);

                const converted = amount * rate;
             return { rate, converted, date: data.date, base: data.base };
        }

        function formatDate(d) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }

      async function loadHistory(from, to, days = 30)
      {
        const end = new Date();

        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

        const startStr = formatDate(start);

        const url = `${API}/${startStr}..?base=${encodeURIComponent(
          from
        )}&symbols=${encodeURIComponent(to)}`;

        const data = await apiFetchJson(url,controller.signal);

        const rows = Object.entries(data.rates).
        map(([date,obj]) => ({date,rate:obj[to]})).
        filter((t) => typeof t === "number").
        sort((a,b)=> a.date.loadCompare(b.date));
        ;
        return rows;
      }

            function drawChart(canvas, points) {
        const ctx = canvas.getContext("2d");

        // ✅ Clear old drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ✅ If no points: show a message
        if (!points.length) {
          ctx.font = "16px system-ui";
          ctx.fillText("No history data available.", 18, 40);
          return;
        }

        // ✅ Padding gives some space from borders
        const padding = 24;
        const W = canvas.width;
        const H = canvas.height;

        // ✅ Find min/max to scale the chart
        const ys = points.map((p) => p.rate);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // ✅ Avoid division by zero if all values are equal
        const safeRange = maxY - minY || 1;

        // ✅ Draw baseline axis (simple horizontal line)
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(padding, H - padding);
        ctx.lineTo(W - padding, H - padding);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ✅ Plot the line
        ctx.beginPath();
        points.forEach((p, i) => {
          // x goes from left padding to right padding
          const x =
            padding + (i * (W - padding * 2)) / (points.length - 1 || 1);

          // y is scaled so min is bottom and max is top
          const y =
            H - padding - ((p.rate - minY) * (H - padding * 2)) / safeRange;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // ✅ Add small labels for min/max
        ctx.globalAlpha = 0.85;
        ctx.font = "14px system-ui";
        ctx.fillText(`Min: ${minY.toFixed(6)}`, padding, 18);
        ctx.fillText(`Max: ${maxY.toFixed(6)}`, padding + 160, 18);
        ctx.globalAlpha = 1;
      }

      function renderHistoryTable(rows) {
       const last = rows.slice(-12).reverse();
       UI.historyBody.innerHTML = last.map((r)=> {
        `
    <tr>
      <td>${r.date}</td>
      <td>${r.rate.toFixed(6)}</td>
    </tr>
  `
       }).join();
      }

      async function run()
      {
        if (controller) {
          controller.abort();
          controller = new AbortController();
        }

        setError("");
        const amount = Number(UI.amount.value);
        const from = UI.from.value;
        const to = UI.to.value;

        if(!Number.isFinite(amount)|| amount < 0)
                    return setError("❌ Enter a valid positive amount.");
        if(to===from) return setError("❌ Choose two different currencies.");
        setLoading(true);

        try {
          const { rate, converted, date } = await convertOnce(from, to, amount);

          UI.result.textContent = `${converted.toFixed(2)} ${to}`;
          UI.meta.textContent = `${amount.toFixed(2)} ${from} → ${to}`;
          UI.ratePill.textContent = `Rate: 1 ${from} = ${rate.toFixed(
            6
          )} ${to}`;
          UI.datePill.textContent = `Date: ${date}`;

          const rows = await loadHistory(from,to,30);
          drawChart(UI.chart,rows);
          renderHistoryTable(rows);

        }
        catch(e)
        {
        if (e.name==="AbortError") {
        return ; 
        }
        setError(e.message);
        }
        finally {
          setLoading(false);
        }
      }

      UI.btnConvert.addEventListener("click",run);

      UI.btnSwap.addEventListener("click", () => {
        const tmp = UI.from.value;
        UI.from.value = UI.to.value;
        UI.to.value = tmp;
        run();
      });

      UI.btnUseUSDJOD.addEventListener("click", () => {
        UI.from.value = "USD";
        run();
      });

      UI.btnUseEURUSD.addEventListener("click",() => {
        UI.from.value ="EUR";
        UI.to.value = "USD";
        run();
      });

        UI.amount.addEventListener("keydown", (e) => {
        if (e.key === "Enter") run();
      });

      (async function boot()
    {
      setLoading(true);

      try {
        controller = new AbortController();

        await loadCurrencies();
        await run();

      }
      catch(e)
      {
        setError(`❌ ${e.message}`);
      }
      finally
      {
        setLoading(false);
      }
    })();

