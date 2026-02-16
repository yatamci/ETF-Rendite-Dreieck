// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ETF Calculation Logic
const etfSelect = document.getElementById('etf-select');
const startYearInput = document.getElementById('start-year');
const endYearInput = document.getElementById('end-year');
const calculateBtn = document.getElementById('calculate-btn');
const resultSection = document.getElementById('result-section');

calculateBtn.addEventListener('click', calculateReturns);

// Allow Enter key to trigger calculation
startYearInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateReturns();
});
endYearInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateReturns();
});

function calculateReturns() {
    const selectedETF = etfSelect.value;
    const startYear = parseInt(startYearInput.value);
    const endYear = parseInt(endYearInput.value);

    // Validation
    if (!startYear || !endYear) {
        alert('Bitte Start- und Endjahr eingeben');
        return;
    }

    if (startYear >= endYear) {
        alert('Startjahr muss vor dem Endjahr liegen');
        return;
    }

    const data = etfData[selectedETF];
    
    if (!data) {
        alert('ETF-Daten nicht gefunden');
        return;
    }

    // Check if years are in range
    const minYear = data.years[0];
    const maxYear = data.years[data.years.length - 1];

    if (startYear < minYear || endYear > maxYear) {
        alert(`Daten verfügbar von ${minYear} bis ${maxYear}`);
        return;
    }

    // Calculate returns
    const startIndex = data.years.indexOf(startYear);
    const endIndex = data.years.indexOf(endYear);

    if (startIndex === -1 || endIndex === -1) {
        alert('Jahr nicht in den Daten verfügbar');
        return;
    }

    // Calculate average annual return and total return
    let cumulativeReturn = 1;
    for (let i = startIndex; i <= endIndex; i++) {
        cumulativeReturn *= (1 + data.returns[i] / 100);
    }

    const years = endYear - startYear + 1;
    const avgReturn = (Math.pow(cumulativeReturn, 1 / years) - 1) * 100;
    const totalReturn = (cumulativeReturn - 1) * 100;
    const finalValue = 10000 * cumulativeReturn;

    // Display results
    displayResults(data.name, startYear, endYear, avgReturn, totalReturn, finalValue);
    
    // Generate triangle
    generateTriangle(selectedETF, startYear, endYear);

    // Show result section
    resultSection.classList.remove('hidden');
    
    // Scroll to results on mobile
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function displayResults(etfName, startYear, endYear, avgReturn, totalReturn, finalValue) {
    document.getElementById('period').textContent = `${startYear} - ${endYear}`;
    document.getElementById('avg-return').textContent = `${avgReturn.toFixed(2)}%`;
    document.getElementById('total-return').textContent = `${totalReturn.toFixed(2)}%`;
    document.getElementById('final-value').textContent = `${formatNumber(finalValue)} €`;
}

function generateTriangle(selectedETF, requestedStartYear, requestedEndYear) {
    const data = etfData[selectedETF];
    const triangleDiv = document.getElementById('triangle');
    
    // Filter years to show only requested range
    const startIdx = data.years.indexOf(requestedStartYear);
    const endIdx = data.years.indexOf(requestedEndYear);
    
    const yearsToShow = data.years.slice(startIdx, endIdx + 1);
    
    // Create table
    let table = '<table class="triangle-table"><thead><tr><th>Kauf ↓ / Verkauf →</th>';
    
    // Header row with sell years
    yearsToShow.forEach(year => {
        table += `<th>${year}</th>`;
    });
    table += '</tr></thead><tbody>';

    // Data rows
    for (let buyIdx = 0; buyIdx < yearsToShow.length; buyIdx++) {
        const buyYear = yearsToShow[buyIdx];
        table += `<tr><th>${buyYear}</th>`;
        
        for (let sellIdx = 0; sellIdx < yearsToShow.length; sellIdx++) {
            if (sellIdx < buyIdx) {
                table += '<td class="empty"></td>';
            } else {
                const sellYear = yearsToShow[sellIdx];
                const avgReturn = calculateAverageReturn(data, buyYear, sellYear);
                const color = getColorForReturn(avgReturn);
                const tooltip = `${buyYear} → ${sellYear}: ${avgReturn.toFixed(1)}%`;
                table += `<td style="background-color: ${color}" title="${tooltip}">${avgReturn.toFixed(1)}%</td>`;
            }
        }
        table += '</tr>';
    }

    table += '</tbody></table>';
    triangleDiv.innerHTML = table;
}

function calculateAverageReturn(data, startYear, endYear) {
    const startIndex = data.years.indexOf(startYear);
    const endIndex = data.years.indexOf(endYear);

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return 0;
    }

    if (startIndex === endIndex) {
        return data.returns[startIndex];
    }

    let cumulativeReturn = 1;
    for (let i = startIndex; i <= endIndex; i++) {
        cumulativeReturn *= (1 + data.returns[i] / 100);
    }

    const years = endYear - startYear + 1;
    const avgReturn = (Math.pow(cumulativeReturn, 1 / years) - 1) * 100;
    
    return avgReturn;
}

function getColorForReturn(returnValue) {
    if (returnValue < 0) {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-negative').trim();
    } else if (returnValue < 5) {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-low').trim();
    } else if (returnValue < 10) {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-medium').trim();
    } else if (returnValue < 15) {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-high').trim();
    } else {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-very-high').trim();
    }
}

function formatNumber(num) {
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

// Set current year as default end year
const currentYear = new Date().getFullYear();
if (currentYear <= 2024) {
    endYearInput.value = currentYear;
}

// Initialize with a default calculation on load (optional)
// Uncomment the line below if you want to show results immediately
// calculateReturns();
