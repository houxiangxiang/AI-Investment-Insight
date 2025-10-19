document.getElementById('clickme').addEventListener('click', async () => {
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('ai-advice').innerHTML = '';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const h3s = Array.from(document.querySelectorAll('h3'))
                    .map(el => el.innerText.trim())
                    .filter(text => text.length > 20);
                return h3s;
            },
        });

        const titles = results[0].result;

        const { defaultTemperature, maxTemperature, defaultTopK, maxTopK } =
            await LanguageModel.params();

        const available = await LanguageModel.availability();

        if (available !== 'unavailable') {
            const session = await LanguageModel.create();
            const asset = document.getElementById('asset').value;
            const risk = document.getElementById('risk').value;
            const timeline = document.getElementById('timeline').value;
            const goal = document.getElementById('goal').value;
            const portfolio = document.querySelectorAll('input[name="portfolio"]:checked');
            const selectedPortfolio = Array.from(portfolio).map(cb => cb.value);

            const promptText = `You are a skilled U.S. ${asset} trader. Below is my investment profile:
Risk tolerance: ${risk}
Investment timeline: ${timeline}
Existing portfolio: ${selectedPortfolio.length > 0 ? selectedPortfolio.join(", ") : "none"}
Investment goal: ${goal}
Please give two outputs based on the news at the bottom:
1. Market Sentiment: select from Bullish, Bearish, or Neutral. And follow up with a short explanation no more than 50 words.
2. Investment suggestion (no more than 50 words)
Output use HTML tag, other than Markdown tag.
News:
${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`
            console.info(promptText);
            const stream = session.promptStreaming(promptText);
            var result = '';
            for await (const chunk of stream) {
                result += chunk;
                const cleaned = result.replace(/```[a-zA-Z]*\n?/g, '');
                document.getElementById("ai-advice").innerHTML = cleaned;
            }

            console.log(result);
        }
    } catch (e) {
        console.error('Error:', e);
        document.getElementById('ai-advice').innerText = '❌ Something went wrong.';
    } finally {
        // 隐藏 spinner
        document.getElementById('spinner').style.display = 'none';
    }
})

document.addEventListener("DOMContentLoaded", () => {
    const assetSelect = document.getElementById("asset");

    const portfolioContainer = document.querySelector(".checkbox-group");

    const portfolioOptions = {
        stock: [
            { id: "technology", label: "Technology" },
            { id: "finance", label: "Finance" },
            { id: "healthcare", label: "Healthcare" },
            { id: "consumer", label: "Consumer" },
            { id: "energy", label: "Energy & Industrials" }
        ],
        crypto: [
            { id: "bitcoin", label: "Bitcoin" },
            { id: "ethereum", label: "Ethereum" },
            { id: "defi", label: "DeFi Projects" },
            { id: "nft", label: "NFTs" }
        ],
        housing: [
            { id: "residential", label: "Residential" },
            { id: "commercial", label: "Commercial" },
            { id: "reit", label: "REITs" }
        ]
    };

    function updatePortfolioOptions(asset) {
        console.log(`call update portfolio with ${asset}`);

        portfolioContainer.innerHTML = "";

        (portfolioOptions[asset] || []).forEach(opt => {
            const div = document.createElement("div");
            div.className = "checkbox-item";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = opt.id;
            input.name = "portfolio";
            input.value = opt.id;

            const label = document.createElement("label");
            label.htmlFor = opt.id;
            label.textContent = opt.label;

            div.appendChild(input);
            div.appendChild(label);
            portfolioContainer.appendChild(div);
        });
    }

    updatePortfolioOptions(assetSelect.value);

    assetSelect.addEventListener("change", (e) => {
        updatePortfolioOptions(e.target.value);
    });
});

