var storeKey = "invoiceManagerData";
var sessionUser = { name: "usuario.demo", role: "Facturador" };
var currentItems = [];
var selectedInvoiceId = null;
var financeChart = null;

var data = loadData();
hydrateStaticData();
bindUI();
refreshAll();

function loadData() {
  var raw = localStorage.getItem(storeKey);
  if (raw) {
    return JSON.parse(raw);
  }
  return {
    numeration: { prefix: "FAC-", next: 1001 },
    clients: [
      { id: 1, name: "Constructora Andina", email: "cartera@andina.com", taxId: "900111222", status: "Activo" },
      { id: 2, name: "Distribuciones Norte", email: "tesoreria@norte.com", taxId: "901555777", status: "Activo" },
      { id: 3, name: "Grupo Atlas", email: "pagos@atlas.com", taxId: "900999111", status: "Activo" }
    ],
    products: [
      { id: 1, name: "Licencia anual ERP", price: 1200 },
      { id: 2, name: "Soporte premium", price: 600 },
      { id: 3, name: "Horas consultoria", price: 80 },
      { id: 4, name: "Implementacion inicial", price: 3500 }
    ],
    invoices: [],
    payments: [],
    reminders: [],
    creditNotes: [],
    audit: []
  };
}

function saveData() {
  localStorage.setItem(storeKey, JSON.stringify(data));
}

function hydrateStaticData() {
  $("#invoiceDate").val(todayISO());
  $("#dueDate").val(addDaysISO(30));
  $("#paymentDate").val(todayISO());

  var clientOptions = data.clients.map(function (c) {
    return '<option value="' + c.id + '">' + c.name + "</option>";
  }).join("");
  $("#invoiceClient").html(clientOptions);
  $("#paymentClient").html(clientOptions);

  var productOptions = data.products.map(function (p) {
    return '<option value="' + p.id + '">' + p.name + "</option>";
  }).join("");
  $("#itemProduct").html(productOptions);
  if (data.products.length) {
    $("#itemPrice").val(data.products[0].price);
  }
}

function bindUI() {
  $(".nav-sections a").on("click", function (e) {
    e.preventDefault();
    var view = $(this).data("view");
    $(".nav-sections li").removeClass("active");
    $(this).parent().addClass("active");
    $(".view").removeClass("active");
    $("#view-" + view).addClass("active");
    refreshAll();
  });

  $("#roleSelector").on("change", function () {
    sessionUser.role = $(this).val();
    addAudit("Cambio de rol", "Rol activo: " + sessionUser.role);
  });

  $("#itemProduct").on("change", function () {
    var p = findProduct(Number($(this).val()));
    if (p) {
      $("#itemPrice").val(p.price);
    }
  });

  $("#addItemBtn").on("click", function () {
    addItemDraft();
  });

  $("#saveDraftBtn").on("click", function () {
    saveInvoice("Borrador");
  });

  $("#emitBtn").on("click", function () {
    saveInvoice("Emitida");
  });

  $("#previewBtn").on("click", function () {
    previewInvoice();
  });

  $("#downloadPdfBtn").on("click", function () {
    downloadPDF();
  });

  $("#sendInvoiceBtn").on("click", function () {
    sendInvoice();
  });

  $("#accountSearch, #accountStateFilter").on("keyup change", function () {
    renderAccounts();
  });

  $("#exportAccountsBtn").on("click", function () {
    exportAccountsCSV();
  });

  $("#bulkReminderBtn").on("click", function () {
    sendBulkReminders();
  });

  $("#paymentClient").on("change", function () {
    renderPaymentInvoiceCandidates();
  });

  $("#applyPaymentBtn").on("click", function () {
    applyPayment();
  });

  $("#detailLoadBtn").on("click", function () {
    loadInvoiceDetail();
  });

  $("#createCreditBtn").on("click", function () {
    createCreditNote();
  });

  $("#annulInvoiceBtn").on("click", function () {
    annulInvoice();
  });
}

function addItemDraft() {
  var productId = Number($("#itemProduct").val());
  var product = findProduct(productId);
  if (!product) {
    alert("Producto no encontrado");
    return;
  }

  var qty = Number($("#itemQty").val() || 0);
  var price = Number($("#itemPrice").val() || 0);
  var disc = Number($("#itemDiscount").val() || 0);
  var tax = Number($("#itemTax").val() || 0);

  if (qty <= 0) {
    alert("Cantidad invalida");
    return;
  }

  currentItems.push({
    id: Date.now() + Math.floor(Math.random() * 9999),
    productId: product.id,
    detail: product.name,
    qty: qty,
    price: price,
    discountPct: disc,
    taxPct: tax
  });

  renderCurrentItems();
}

function renderCurrentItems() {
  var body = "";
  currentItems.forEach(function (i) {
    var calc = calcItem(i);
    body += "<tr>" +
      "<td>" + i.detail + "</td>" +
      "<td>" + i.qty + "</td>" +
      "<td>" + money(i.price) + "</td>" +
      "<td>" + i.discountPct + "%</td>" +
      "<td>" + i.taxPct + "%</td>" +
      "<td>" + money(calc.subtotal) + "</td>" +
      "<td>" + money(calc.total) + "</td>" +
      '<td><button class="btn btn-xs btn-danger" onclick="removeItemDraft(' + i.id + ')">x</button></td>' +
      "</tr>";
  });
  $("#invoiceItemsTable tbody").html(body);
  var totals = calcTotals(currentItems, Number($("#withholding").val() || 0));
  $("#invoiceTotals").text("Subtotal: " + money(totals.subtotal) + " | Impuestos: " + money(totals.taxTotal) + " | Total: " + money(totals.total));
}

function removeItemDraft(id) {
  currentItems = currentItems.filter(function (x) { return x.id !== id; });
  renderCurrentItems();
}

function saveInvoice(targetStatus) {
  var clientId = Number($("#invoiceClient").val());
  var invoiceDate = $("#invoiceDate").val();
  var cond = $("#paymentCondition").val();
  var dueDate = $("#dueDate").val();
  var notes = $("#invoiceNotes").val();
  var withholding = Number($("#withholding").val() || 0);
  var email = $("#recipientEmail").val();

  if (!clientId || !invoiceDate) {
    alert("Cliente y fecha son obligatorios");
    return;
  }

  if (currentItems.length === 0) {
    alert("Toda factura debe tener al menos un detalle");
    return;
  }

  if (cond === "Credito" && !dueDate) {
    alert("Una factura a credito requiere vencimiento");
    return;
  }

  var totals = calcTotals(currentItems, withholding);
  var id = "INV-" + Date.now();
  var existingByDraftHash = findMatchingDraft(clientId, invoiceDate, totals.total);
  var consecutive = "";
  var emittedAt = null;
  var status = targetStatus;

  if (targetStatus === "Emitida") {
    if (existingByDraftHash && existingByDraftHash.emittedAt) {
      alert("La emision ya fue ejecutada para esta factura");
      return;
    }
    consecutive = data.numeration.prefix + data.numeration.next;
    data.numeration.next += 1;
    emittedAt = new Date().toISOString();
  }

  if (targetStatus === "Borrador") {
    status = "Borrador";
  }

  var invoice = {
    id: id,
    consecutive: consecutive || "BORR-" + data.invoices.length,
    clientId: clientId,
    invoiceDate: invoiceDate,
    dueDate: dueDate,
    paymentCondition: cond,
    notes: notes,
    items: JSON.parse(JSON.stringify(currentItems)),
    withholdingPct: withholding,
    totals: totals,
    paid: 0,
    balance: totals.total,
    status: status,
    email: email,
    emittedAt: emittedAt,
    sentHistory: [],
    collectionActions: [],
    creditNotes: [],
    createdAt: new Date().toISOString(),
    canceledReason: ""
  };

  data.invoices.push(invoice);
  addAudit("Factura " + status, invoice.consecutive + " | Cliente " + clientName(clientId) + " | Total " + money(invoice.totals.total));

  if (status === "Emitida") {
    addAudit("Cuenta por cobrar creada", invoice.consecutive + " | Saldo " + money(invoice.balance));
  }

  saveData();
  resetInvoiceForm();
  refreshAll();
}

function findMatchingDraft(clientId, invoiceDate, total) {
  return data.invoices.find(function (x) {
    return x.clientId === clientId && x.invoiceDate === invoiceDate && Number(x.totals.total.toFixed(2)) === Number(total.toFixed(2));
  });
}

function previewInvoice() {
  if (currentItems.length === 0) {
    alert("No hay items para vista previa");
    return;
  }
  var cName = clientName(Number($("#invoiceClient").val()));
  var due = $("#dueDate").val();
  var totals = calcTotals(currentItems, Number($("#withholding").val() || 0));
  var html = "<h4>Cliente: " + cName + "</h4>" +
    "<p>Fecha: " + $("#invoiceDate").val() + " | Vencimiento: " + due + "</p>" +
    "<table class='table table-bordered'><thead><tr><th>Detalle</th><th>Cant</th><th>Total</th></tr></thead><tbody>";

  currentItems.forEach(function (i) {
    var c = calcItem(i);
    html += "<tr><td>" + i.detail + "</td><td>" + i.qty + "</td><td>" + money(c.total) + "</td></tr>";
  });
  html += "</tbody></table><h4>Total: " + money(totals.total) + "</h4>";
  $("#previewBody").html(html);
  $("#previewModal").modal("show");
}

function downloadPDF() {
  if (currentItems.length === 0) {
    alert("No hay informacion para PDF");
    return;
  }
  var doc = new jsPDF();
  var y = 15;
  doc.setFontSize(15);
  doc.text("InvoiceManager - Factura", 10, y);
  y += 10;
  doc.setFontSize(11);
  doc.text("Cliente: " + clientName(Number($("#invoiceClient").val())), 10, y);
  y += 7;
  doc.text("Fecha: " + $("#invoiceDate").val(), 10, y);
  y += 7;
  currentItems.forEach(function (i) {
    var c = calcItem(i);
    doc.text(i.detail + " | Cant: " + i.qty + " | Total: " + money(c.total), 10, y);
    y += 7;
  });
  var totals = calcTotals(currentItems, Number($("#withholding").val() || 0));
  y += 5;
  doc.text("Total general: " + money(totals.total), 10, y);
  doc.save("factura-previa.pdf");
  addAudit("PDF generado", "Factura previa descargada");
  saveData();
  refreshAudit();
}

function sendInvoice() {
  var cons = prompt("Consecutivo de factura a enviar");
  if (!cons) return;
  var inv = data.invoices.find(function (x) { return x.consecutive === cons; });
  if (!inv) {
    alert("Factura no encontrada");
    return;
  }
  if (inv.status === "Borrador") {
    alert("No se puede enviar factura en borrador");
    return;
  }
  var email = inv.email || prompt("Correo de destino", clientEmail(inv.clientId));
  if (!email) {
    alert("Correo requerido");
    return;
  }
  inv.sentHistory.push({ date: new Date().toISOString(), recipient: email, message: "Factura enviada" });
  if (inv.status === "Aprobada" || inv.status === "Emitida") {
    inv.status = "Emitida";
  }
  addAudit("Factura enviada", inv.consecutive + " a " + email);
  saveData();
  refreshAll();
}

function recalcInvoiceState(inv) {
  if (inv.status === "Anulada") {
    return "Anulada";
  }
  if (inv.balance <= 0) {
    return "Pagada";
  }
  if (inv.creditNotes.length > 0) {
    if (inv.balance > 0) {
      return "Con nota credito";
    }
  }
  if (inv.paid > 0 && inv.balance > 0) {
    if (new Date(inv.dueDate || inv.invoiceDate) < new Date()) {
      return "Vencida";
    }
    return "Parcialmente pagada";
  }
  if (new Date(inv.dueDate || inv.invoiceDate) < new Date() && inv.status !== "Borrador") {
    return "Vencida";
  }
  if (inv.status === "Borrador") {
    return "Borrador";
  }
  return "Emitida";
}

function refreshAll() {
  updateStatusByBalance();
  renderCurrentItems();
  renderDashboard();
  renderRecentInvoices();
  renderAccounts();
  renderPaymentInvoiceCandidates();
  renderPaymentsHistory();
  refreshAudit();
  saveData();
}

function updateStatusByBalance() {
  data.invoices.forEach(function (inv) {
    inv.status = recalcInvoiceState(inv);
  });
}

function renderDashboard() {
  var emitted = data.invoices.filter(function (x) { return x.status !== "Borrador"; });
  var factMes = sum(emitted, function (x) { return x.totals.total; });
  var recaudado = sum(data.invoices, function (x) { return x.paid; });
  var pendiente = sum(data.invoices, function (x) { return x.balance; });
  var vencida = sum(data.invoices.filter(function (x) { return x.status === "Vencida"; }), function (x) { return x.balance; });
  var pagadas = data.invoices.filter(function (x) { return x.status === "Pagada"; }).length;
  var parciales = data.invoices.filter(function (x) { return x.status === "Parcialmente pagada"; }).length;
  var promDias = averageDaysToPay();
  var proximos = nextDueCount(7);

  var kpi = [
    { t: "Facturacion mensual", v: money(factMes) },
    { t: "Valor recaudado", v: money(recaudado) },
    { t: "Saldo pendiente", v: money(pendiente) },
    { t: "Cartera vencida", v: money(vencida) },
    { t: "Facturas emitidas", v: emitted.length },
    { t: "Pagadas / Parciales", v: pagadas + " / " + parciales },
    { t: "Promedio dias pago", v: promDias },
    { t: "Proximos vencimientos", v: proximos }
  ];

  var html = "";
  kpi.forEach(function (x) {
    html += '<div class="col-sm-6 col-md-3"><div class="kpi-card"><div class="kpi-title">' + x.t + '</div><div class="kpi-value">' + x.v + "</div></div></div>";
  });
  $("#kpiGrid").html(html);

  var debtors = data.clients.map(function (c) {
    var debt = sum(data.invoices.filter(function (inv) { return inv.clientId === c.id; }), function (i) { return i.balance; });
    return { client: c.name, debt: debt };
  }).sort(function (a, b) { return b.debt - a.debt; }).slice(0, 5);

  var debtHtml = "";
  debtors.forEach(function (d) {
    debtHtml += '<li class="list-group-item">' + d.client + ' <span class="badge">' + money(d.debt) + "</span></li>";
  });
  $("#topDebtors").html(debtHtml || "<li class='list-group-item'>Sin datos</li>");

  drawFinanceChart(factMes, recaudado, pendiente, vencida);
}

function drawFinanceChart(factMes, recaudado, pendiente, vencida) {
  var ctx = document.getElementById("financeChart").getContext("2d");
  if (financeChart) {
    financeChart.destroy();
  }
  financeChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Facturacion", "Recaudo", "Pendiente", "Vencida"],
      datasets: [{
        label: "Valores",
        data: [factMes, recaudado, pendiente, vencida],
        backgroundColor: ["#1b2a4e", "#4caf50", "#f9a826", "#d62828"]
      }]
    },
    options: {
      responsive: true,
      legend: { display: false }
    }
  });
}

function renderRecentInvoices() {
  var rows = "";
  data.invoices.slice().reverse().slice(0, 8).forEach(function (inv) {
    rows += "<tr>" +
      "<td>" + inv.consecutive + "</td>" +
      "<td>" + clientName(inv.clientId) + "</td>" +
      "<td>" + inv.invoiceDate + "</td>" +
      "<td>" + (inv.dueDate || "-") + "</td>" +
      "<td>" + money(inv.totals.total) + "</td>" +
      "<td>" + money(inv.balance) + "</td>" +
      "<td>" + inv.status + "</td>" +
      "</tr>";
  });
  $("#recentInvoicesTable tbody").html(rows);
}

function renderAccounts() {
  var q = ($("#accountSearch").val() || "").toLowerCase();
  var fState = $("#accountStateFilter").val();

  var rows = "";
  data.invoices.forEach(function (inv) {
    var str = (inv.consecutive + " " + clientName(inv.clientId)).toLowerCase();
    var ok = str.indexOf(q) >= 0;
    if (fState && inv.status !== fState) {
      ok = false;
    }
    if (!ok) return;

    var lastAction = inv.collectionActions.length ? inv.collectionActions[inv.collectionActions.length - 1].date.substring(0, 10) : "-";
    rows += "<tr>" +
      '<td><input class="acc-select" type="checkbox" data-id="' + inv.id + '" /></td>' +
      "<td>" + inv.consecutive + "</td>" +
      "<td>" + clientName(inv.clientId) + "</td>" +
      "<td>" + inv.invoiceDate + "</td>" +
      "<td>" + (inv.dueDate || "-") + "</td>" +
      "<td>" + money(inv.totals.total) + "</td>" +
      "<td>" + money(inv.paid) + "</td>" +
      "<td>" + money(inv.balance) + "</td>" +
      "<td>" + daysPastDue(inv) + "</td>" +
      "<td>" + inv.status + "</td>" +
      "<td>" + lastAction + "</td>" +
      '<td><button class="btn btn-xs btn-default" onclick="quickPayment(\'' + inv.id + '\')">Pago</button> <button class="btn btn-xs btn-primary" onclick="quickReminder(\'' + inv.id + '\')">Recordar</button></td>' +
      "</tr>";
  });
  $("#accountsTable tbody").html(rows);
}

function quickPayment(id) {
  var inv = data.invoices.find(function (x) { return x.id === id; });
  if (!inv) return;
  $(".nav-sections a[data-view='payments']").click();
  $("#paymentClient").val(String(inv.clientId));
  renderPaymentInvoiceCandidates();
}

function quickReminder(id) {
  var inv = data.invoices.find(function (x) { return x.id === id; });
  if (!inv) return;
  sendReminderForInvoice(inv);
  refreshAll();
}

function sendBulkReminders() {
  var ids = [];
  $(".acc-select:checked").each(function () {
    ids.push($(this).data("id"));
  });
  if (!ids.length) {
    alert("Seleccione al menos una factura");
    return;
  }
  ids.forEach(function (id) {
    var inv = data.invoices.find(function (x) { return x.id === id; });
    if (inv) sendReminderForInvoice(inv);
  });
  saveData();
  refreshAll();
}

function sendReminderForInvoice(inv) {
  if (inv.balance <= 0) return;
  var rem = {
    id: "REM-" + Date.now() + "-" + Math.floor(Math.random() * 100),
    invoiceId: inv.id,
    date: new Date().toISOString(),
    message: "Recordatorio de pago " + inv.consecutive + " saldo " + money(inv.balance)
  };
  data.reminders.push(rem);
  inv.collectionActions.push({ date: rem.date, action: "Recordatorio" });
  addAudit("Recordatorio enviado", inv.consecutive + " | " + money(inv.balance));
}

function renderPaymentInvoiceCandidates() {
  var cid = Number($("#paymentClient").val());
  var rows = "";
  data.invoices.filter(function (x) {
    return x.clientId === cid && x.balance > 0 && x.status !== "Anulada";
  }).forEach(function (inv) {
    rows += "<tr>" +
      "<td>" + inv.consecutive + "</td>" +
      "<td>" + money(inv.balance) + "</td>" +
      '<td><input class="apply-amount form-control" type="number" min="0" step="0.01" data-id="' + inv.id + '" value="0" /></td>' +
      "</tr>";
  });
  $("#paymentInvoicesTable tbody").html(rows || "<tr><td colspan='3'>Sin facturas pendientes para este cliente</td></tr>");
}

function applyPayment() {
  if (sessionUser.role === "Facturador") {
    alert("El rol Facturador no registra pagos");
    return;
  }

  var cid = Number($("#paymentClient").val());
  var pDate = $("#paymentDate").val();
  var method = $("#paymentMethod").val();
  var ref = $("#paymentReference").val();
  var amount = Number($("#paymentAmount").val() || 0);
  var support = $("#paymentSupport").val();
  var allocations = [];
  var totalApplied = 0;

  $(".apply-amount").each(function () {
    var v = Number($(this).val() || 0);
    if (v > 0) {
      allocations.push({ invoiceId: $(this).data("id"), amount: v });
      totalApplied += v;
    }
  });

  if (amount <= 0 || allocations.length === 0) {
    alert("Ingrese valor y facturas a aplicar");
    return;
  }

  if (Number(totalApplied.toFixed(2)) !== Number(amount.toFixed(2))) {
    alert("La suma aplicada debe coincidir con el valor del pago");
    return;
  }

  for (var i = 0; i < allocations.length; i += 1) {
    var inv = data.invoices.find(function (x) { return x.id === allocations[i].invoiceId; });
    if (!inv) {
      alert("Factura no encontrada para aplicar");
      return;
    }
    if (allocations[i].amount > inv.balance) {
      alert("Los pagos no pueden superar el saldo");
      return;
    }
  }

  var payment = {
    id: "PAY-" + Date.now(),
    clientId: cid,
    date: pDate,
    method: method,
    reference: ref,
    amount: amount,
    support: support,
    allocations: allocations
  };

  allocations.forEach(function (a) {
    var inv = data.invoices.find(function (x) { return x.id === a.invoiceId; });
    inv.paid = Number((inv.paid + a.amount).toFixed(2));
    inv.balance = Number((inv.balance - a.amount).toFixed(2));
    inv.collectionActions.push({ date: new Date().toISOString(), action: "Pago aplicado " + money(a.amount) });
  });

  data.payments.push(payment);
  addAudit("Pago registrado", payment.id + " | Cliente " + clientName(cid) + " | " + money(amount));
  saveData();
  refreshAll();
  $("#paymentAmount").val("");
  $("#paymentReference").val("");
  $("#paymentSupport").val("");
}

function renderPaymentsHistory() {
  var rows = "";
  data.payments.slice().reverse().forEach(function (p) {
    rows += "<tr>" +
      "<td>" + p.id + "</td>" +
      "<td>" + clientName(p.clientId) + "</td>" +
      "<td>" + p.date + "</td>" +
      "<td>" + p.method + "</td>" +
      "<td>" + p.reference + "</td>" +
      "<td>" + money(p.amount) + "</td>" +
      "</tr>";
  });
  $("#paymentsHistoryTable tbody").html(rows);
}

function loadInvoiceDetail() {
  var cons = $("#detailInvoiceSearch").val();
  var inv = data.invoices.find(function (x) { return x.consecutive === cons; });
  if (!inv) {
    alert("Factura no encontrada");
    return;
  }
  selectedInvoiceId = inv.id;
  var html = "";
  html += "<p><b>Factura:</b> " + inv.consecutive + "</p>";
  html += "<p><b>Cliente:</b> " + clientName(inv.clientId) + "</p>";
  html += "<p><b>Total:</b> " + money(inv.totals.total) + "</p>";
  html += "<p><b>Pagado:</b> " + money(inv.paid) + "</p>";
  html += "<p><b>Saldo:</b> " + money(inv.balance) + "</p>";
  html += "<p><b>Estado:</b> " + inv.status + "</p>";
  html += "<p><b>Envios:</b> " + inv.sentHistory.length + "</p>";

  html += "<h4>Items</h4><table class='table table-bordered'><tr><th>Detalle</th><th>Cant</th><th>Total</th></tr>";
  inv.items.forEach(function (i) {
    html += "<tr><td>" + i.detail + "</td><td>" + i.qty + "</td><td>" + money(calcItem(i).total) + "</td></tr>";
  });
  html += "</table>";

  html += "<h4>Notas credito</h4><ul>";
  inv.creditNotes.forEach(function (cn) {
    html += "<li>" + cn.id + " - " + cn.type + " - " + money(cn.amount) + " - " + cn.reason + "</li>";
  });
  html += "</ul>";

  html += "<h4>Historial envios</h4><ul>";
  inv.sentHistory.forEach(function (s) {
    html += "<li>" + s.date.substring(0, 10) + " a " + s.recipient + "</li>";
  });
  html += "</ul>";

  html += "<h4>Gestiones de cobro</h4><ul>";
  inv.collectionActions.forEach(function (g) {
    html += "<li>" + g.date.substring(0, 10) + " - " + g.action + "</li>";
  });
  html += "</ul>";

  $("#invoiceDetailBody").html(html);
  $("#invoiceDetailPanel").removeClass("hidden");
}

function createCreditNote() {
  if (!selectedInvoiceId) {
    alert("Primero cargue una factura");
    return;
  }

  var inv = data.invoices.find(function (x) { return x.id === selectedInvoiceId; });
  if (!inv) return;

  var reason = $("#creditReason").val();
  var amount = Number($("#creditAmount").val() || 0);
  var type = $("#creditType").val();

  if (!reason || amount <= 0) {
    alert("Motivo y monto son obligatorios");
    return;
  }

  if (amount > inv.balance) {
    alert("La nota credito no puede superar el saldo");
    return;
  }

  if (type === "Total") {
    amount = inv.balance;
  }

  var cn = {
    id: "NC-" + Date.now(),
    invoiceId: inv.id,
    reason: reason,
    amount: amount,
    type: type,
    date: new Date().toISOString()
  };

  data.creditNotes.push(cn);
  inv.creditNotes.push(cn);
  inv.balance = Number((inv.balance - amount).toFixed(2));
  inv.collectionActions.push({ date: new Date().toISOString(), action: "Nota credito " + money(amount) });
  addAudit("Nota credito generada", inv.consecutive + " | " + money(amount));
  saveData();
  refreshAll();
  loadInvoiceDetail();
}

function annulInvoice() {
  if (!selectedInvoiceId) {
    alert("No hay factura seleccionada");
    return;
  }
  var inv = data.invoices.find(function (x) { return x.id === selectedInvoiceId; });
  if (!inv) return;
  var reason = prompt("Motivo de anulacion");
  if (!reason) {
    alert("Toda anulacion requiere motivo");
    return;
  }
  inv.status = "Anulada";
  inv.canceledReason = reason;
  inv.collectionActions.push({ date: new Date().toISOString(), action: "Anulada" });
  addAudit("Factura anulada", inv.consecutive + " | Motivo: " + reason);
  saveData();
  refreshAll();
  loadInvoiceDetail();
}

function exportAccountsCSV() {
  var lines = ["Factura,Cliente,Emision,Vencimiento,Total,Pagado,Saldo,Estado,DiasMora"];
  data.invoices.forEach(function (inv) {
    lines.push([
      inv.consecutive,
      clientName(inv.clientId),
      inv.invoiceDate,
      inv.dueDate || "",
      inv.totals.total,
      inv.paid,
      inv.balance,
      inv.status,
      daysPastDue(inv)
    ].join(","));
  });
  var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "cuentas_por_cobrar.csv";
  link.click();
  addAudit("Exportacion", "Reporte cartera descargado");
  saveData();
  refreshAudit();
}

function refreshAudit() {
  var rows = "";
  data.audit.slice().reverse().slice(0, 300).forEach(function (a) {
    rows += "<tr>" +
      "<td>" + a.date.substring(0, 19).replace("T", " ") + "</td>" +
      "<td>" + a.user + "</td>" +
      "<td>" + a.action + "</td>" +
      '<td class="audit-detail">' + a.detail + "</td>" +
      "</tr>";
  });
  $("#auditTable tbody").html(rows);
}

function addAudit(action, detail) {
  data.audit.push({
    date: new Date().toISOString(),
    user: sessionUser.name + " (" + sessionUser.role + ")",
    action: action,
    detail: detail
  });
}

function calcItem(i) {
  var gross = i.qty * i.price;
  var discountVal = gross * (i.discountPct / 100);
  var net = gross - discountVal;
  var taxVal = net * (i.taxPct / 100);
  return {
    gross: gross,
    discount: discountVal,
    subtotal: net,
    tax: taxVal,
    total: net + taxVal
  };
}

function calcTotals(items, withholdingPct) {
  var subtotal = 0;
  var taxTotal = 0;
  items.forEach(function (i) {
    var c = calcItem(i);
    subtotal += c.subtotal;
    taxTotal += c.tax;
  });
  var beforeWithholding = subtotal + taxTotal;
  var withholding = beforeWithholding * (withholdingPct / 100);
  var total = beforeWithholding - withholding;
  return {
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    withholding: round2(withholding),
    total: round2(total)
  };
}

function resetInvoiceForm() {
  currentItems = [];
  $("#invoiceDate").val(todayISO());
  $("#dueDate").val(addDaysISO(30));
  $("#paymentCondition").val("Contado");
  $("#withholding").val("0");
  $("#invoiceNotes").val("");
  $("#recipientEmail").val("");
  renderCurrentItems();
}

function findProduct(id) {
  return data.products.find(function (p) { return p.id === id; });
}

function clientName(clientId) {
  var c = data.clients.find(function (x) { return x.id === clientId; });
  return c ? c.name : "Cliente";
}

function clientEmail(clientId) {
  var c = data.clients.find(function (x) { return x.id === clientId; });
  return c ? c.email : "";
}

function sum(arr, mapper) {
  var total = 0;
  arr.forEach(function (x) { total += Number(mapper(x) || 0); });
  return round2(total);
}

function money(v) {
  return "$" + Number(v || 0).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round2(v) {
  return Number((v || 0).toFixed(2));
}

function todayISO() {
  return new Date().toISOString().substring(0, 10);
}

function addDaysISO(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

function daysPastDue(inv) {
  if (!inv.dueDate || inv.status === "Pagada" || inv.status === "Anulada") return 0;
  var due = new Date(inv.dueDate);
  var now = new Date();
  var diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function averageDaysToPay() {
  var paidInvoices = data.invoices.filter(function (x) { return x.status === "Pagada" && x.paid > 0; });
  if (!paidInvoices.length) return 0;
  var d = 0;
  paidInvoices.forEach(function (inv) {
    var start = new Date(inv.invoiceDate);
    var end = inv.collectionActions.length ? new Date(inv.collectionActions[inv.collectionActions.length - 1].date) : new Date();
    d += Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  });
  return Math.round(d / paidInvoices.length);
}

function nextDueCount(days) {
  var now = new Date();
  var limit = new Date();
  limit.setDate(limit.getDate() + days);
  return data.invoices.filter(function (inv) {
    if (!inv.dueDate || inv.balance <= 0 || inv.status === "Anulada") return false;
    var d = new Date(inv.dueDate);
    return d >= now && d <= limit;
  }).length;
}

window.removeItemDraft = removeItemDraft;
window.quickPayment = quickPayment;
window.quickReminder = quickReminder;
