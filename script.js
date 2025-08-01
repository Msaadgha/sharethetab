async function processReceipt() {
  const fileInput = document.getElementById('receiptInput');
  const namesInput = document.getElementById('namesInput').value;
  const names = namesInput.split(',').map(n => n.trim()).filter(n => n);

  if (!fileInput.files[0] || names.length === 0) {
    alert("Upload an image and enter names.");
    return;
  }

  const loadingIndicator = document.getElementById('loadingIndicator');
  const loadingText = loadingIndicator.querySelector('p');
  loadingIndicator.style.display = 'block';
  loadingText.textContent = 'Processing receipt... 0%';

  try {
    const image = fileInput.files[0];

    const result = await Tesseract.recognize(image, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          loadingText.textContent = `Processing receipt... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    const text = result.data.text;
    document.getElementById('outputText').innerText = "Extracted Text:\n" + text;

    // Filter out subtotal, total, tax, tip lines
    const itemLines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line =>
        /\d+(\.\d{2})?/.test(line) &&
        !/subtotal|total|tax|tip|amount due/i.test(line)
      );

    const items = itemLines.map(line => {
      const match = line.match(/(.*?)(\d+\.\d{2})$/);
      return match ? { name: match[1].trim(), price: parseFloat(match[2]) } : null;
    }).filter(Boolean);

    const assignmentDiv = document.getElementById('assignments');
    assignmentDiv.innerHTML = '<h3>Assign Items</h3>';

    items.forEach((item, index) => {
      const selectHTML = [`<option value="">-- None --</option>`].concat(
        names.map(n => `<option value="${n}">${n}</option>`)
      ).join('');
      assignmentDiv.innerHTML += `
        <div>
          ${item.name} - $${item.price.toFixed(2)}
          <select id="item-${index}">
            ${selectHTML}
          </select>
        </div>
      `;
    });

    assignmentDiv.dataset.items = JSON.stringify(items);
    document.getElementById('taxTipSection').style.display = 'block';

  } catch (error) {
    alert("An error occurred while processing the receipt.");
    console.error(error);
  } finally {
    loadingIndicator.style.display = 'none';
    fileInput.value = ''; // Reset input for re-upload
  }
}

function calculateSplit() {
  const items = JSON.parse(document.getElementById('assignments').dataset.items);
  const nameInput = document.getElementById('namesInput').value;
  const names = nameInput.split(',').map(n => n.trim()).filter(n => n);

  const subtotals = {};
  names.forEach(name => { subtotals[name] = 0; });

  items.forEach((item, index) => {
    const selectedName = document.getElementById(`item-${index}`).value;
    if (selectedName) { // Only add if assigned
      subtotals[selectedName] += item.price;
    }
  });

  const taxPercent = parseFloat(document.getElementById('taxPercent').value) || 0;
  const tipAmount = parseFloat(document.getElementById('tipAmount').value) || 0;

  const subtotal = Object.values(subtotals).reduce
