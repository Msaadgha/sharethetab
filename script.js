async function processReceipt() {
  const fileInput = document.getElementById('receiptInput');
  const namesInput = document.getElementById('namesInput').value;
  const names = namesInput.split(',').map(n => n.trim());

  if (!fileInput.files[0] || names.length === 0) {
    alert("Upload an image and enter names.");
    return;
  }

  const image = fileInput.files[0];

  const result = await Tesseract.recognize(image, 'eng');
  const text = result.data.text;

  document.getElementById('outputText').innerText = "Extracted Text:\n" + text;

  // Parse items and prices using regex
  const itemLines = text.split('\n').filter(line => /\d+(\.\d{2})?/.test(line));
  const items = itemLines.map(line => {
    const match = line.match(/(.*?)(\d+\.\d{2})$/);
    return match ? { name: match[1].trim(), price: parseFloat(match[2]) } : null;
  }).filter(Boolean);

  const assignmentDiv = document.getElementById('assignments');
  assignmentDiv.innerHTML = '<h3>Assign Items</h3>';

  items.forEach((item, index) => {
    const selectHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
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
}

function calculateSplit() {
  const items = JSON.parse(document.getElementById('assignments').dataset.items);
  const nameInput = document.getElementById('namesInput').value;
  const names = nameInput.split(',').map(n => n.trim());

  const subtotals = {};
  names.forEach(name => { subtotals[name] = 0; });

  items.forEach((item, index) => {
    const selectedName = document.getElementById(`item-${index}`).value;
    subtotals[selectedName] += item.price;
  });

  const taxPercent = parseFloat(document.getElementById('taxPercent').value) || 0;
  const tipAmount = parseFloat(document.getElementById('tipAmount').value) || 0;

  const subtotal = Object.values(subtotals).reduce((a, b) => a + b, 0);
  const taxAmount = (taxPercent / 100) * subtotal;

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h3>Final Amounts</h3>";

  names.forEach(name => {
    const share = subtotals[name];
    const taxShare = (share / subtotal) * taxAmount;
    const tipShare = (share / subtotal) * tipAmount;
    const total = share + taxShare + tipShare;

    resultsDiv.innerHTML += `<p>${name}: $${total.toFixed(2)} (Items: $${share.toFixed(2)}, Tax: $${taxShare.toFixed(2)}, Tip: $${tipShare.toFixed(2)})</p>`;
  });
}
